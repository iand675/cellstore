import module namespace archives = "http://28.io/modules/xbrl/archives";
import module namespace entities = "http://28.io/modules/xbrl/entities";
import module namespace hypercubes = "http://28.io/modules/xbrl/hypercubes";
import module namespace conversion = "http://28.io/modules/xbrl/conversion";
import module namespace reports = "http://28.io/modules/xbrl/reports";
import module namespace components = "http://28.io/modules/xbrl/components";
import module namespace concepts = "http://28.io/modules/xbrl/concepts";

import module namespace companies = "http://28.io/modules/xbrl/profiles/sec/companies";
import module namespace fiscal-core = "http://28.io/modules/xbrl/profiles/sec/fiscal/core";

import module namespace request = "http://www.28msec.com/modules/http-request";
import module namespace response = "http://www.28msec.com/modules/http-response";

import module namespace session = "http://apps.28.io/session";
import module namespace util = "http://secxbrl.info/modules/util";

session:audit-call();

(: Query parameters :)
let $format as string?        := request:param-values("format")
let $ciks as string*          := distinct-values(request:param-values("cik"))
let $tags as string*          := distinct-values(request:param-values("tag"))
let $tickers as string*       := distinct-values(request:param-values("ticker"))
let $sics as string*          := distinct-values(request:param-values("sic"))
let $fiscalYears as string*   := distinct-values(request:param-values("fiscalYear"))
let $fiscalPeriods as string* := distinct-values(request:param-values("fiscalPeriod"))
let $aids as string*          := distinct-values(request:param-values("aid"))
let $validate as string       := request:param-values("validate", "false")
let $report as string?        := request:param-values("report")
let $labels as string        := request:param-values("labels", "false")

(: Post-processing :)
let $format as string? := (: backwards compatibility, to be deprecated  :)
    lower-case(($format, substring-after(request:path(), ".jq."))[1])
let $tags as string* := (: backwards compatibility, to be deprecated :)
    distinct-values($tags ! upper-case($$))
let $fiscalYears as integer* :=
    for $fy in $fiscalYears ! upper-case($$)
    return switch($fy)
           case "LATEST" return $fiscal-core:LATEST_FISCAL_YEAR
           case "ALL" return $fiscal-core:ALL_FISCAL_YEARS
           default return if($fy castable as integer) then integer($fy) else ()
let $fiscalPeriods as string* :=
    for $fp in $fiscalPeriods ! upper-case($$)
    return switch($fp)
           case "ALL" return $fiscal-core:ALL_FISCAL_PERIODS
           default return $fp
let $validate as boolean := $validate = "true"
let $labels as boolean := $labels = "true"

(: Object resolution :)
let $entities := 
    for $entity in 
        companies:companies(
            $ciks,
            $tags,
            $tickers,
            $sics)
    order by $entity.Profiles.SEC.CompanyName
    return $entity
let $report as object? := reports:reports($report)

(: Fact resolution :)
let $filter-override as object? := fiscal-core:filter-override(
    $entities,
    $fiscalYears,
    $fiscalPeriods,
    $aids)
let $facts as object* :=
    let $hypercube := hypercubes:hypercubes-for-components($report, "xbrl:DefaultHypercube")
    let $filtered-aspects := values($hypercube.Aspects)[exists(($$.Domains, $$.DomainRestriction))]
    return if(count($filtered-aspects) lt 2 and not exists(($filter-override)))
    then {
          response:status-code(403);
          session:error("The report filters are too weak, which leads to too big an output.", $format)
    } else
        components:facts(
                $report,
                {|
                    { FilterOverride: $filter-override }[exists($filter-override)],
                    { Validate: $validate }
                |}
            )

let $concepts as object* := 
    reports:concepts($report)
let $facts :=
    for $fact in $facts
    group by $archive := $fact.Aspects."sec:Archive"
    let $archive := archives:archives($archive)
    let $entity := entities:entities($archive.Entity)
    for $fact in $fact
    return
    {|
        trim($fact, ("Labels", "EntityRegistrantName")),
        { "EntityRegistrantName" : $entity.Profiles.SEC.CompanyName },
        if($labels)
        then
            let $language as string := ( $report.$components:DEFAULT-LANGUAGE , $concepts:DEFAULT_LANGUAGE )[1]
            let $role as string := ( $report.Role, $concepts:ANY_COMPONENT_LINK_ROLE )[1]
            let $labels as object? := concepts:labels-for-facts($fact, $role, $concepts:STANDARD_LABEL_ROLE, $language, $concepts, ()) 
            return 
                { Labels : $labels }
        else ()
    |}

let $facts := util:normalize-facts($facts)

let $results :=
    switch ($format)
    case "xml" return {
        response:serialization-parameters({"omit-xml-declaration" : false, indent : true });
        session:comment("xml",
        {
            NumFacts : count($facts),
            TotalNumFacts: session:num-facts(),
            TotalNumArchives: session:num-archives(),
            TotalNumEntities: session:num-entities()
        }),
        <FactTable NetworkIdentifier="http://bizql.io/facttable-for-report"
                TableName="xbrl:FactTableForReport">{
            conversion:facts-to-xml($facts, { Caller: "Report" })
        }</FactTable>
    }
    case "text" case "csv" return {
        response:content-type("text/csv");
        response:header("Content-Disposition", "attachment; filename=facts.csv");
        conversion:facts-to-csv($facts, { Caller: "Report"})
    }
    case "excel" return {
        response:content-type("application/vnd.ms-excel");
        response:header("Content-Disposition", "attachment; filename=fact.csv");
        conversion:facts-to-csv($facts, { Caller: "Report"})
    }
    default return {
        response:content-type("application/json");
        response:serialization-parameters({"indent" : true});
        {|
            { NetworkIdentifier : "http://secxbrl.info/facts" },
            { TableName : "xbrl:Facts" },
            { FactTable : [ $facts ] },
            session:comment("json", {
                    NumFacts : count($facts),
                    TotalNumFacts: session:num-facts(),
                    TotalNumArchives: session:num-archives(),
                    TotalNumEntities: session:num-entities()
                })
        |}
    }
return
    util:check-and-return-results($entities, $results, $format)
