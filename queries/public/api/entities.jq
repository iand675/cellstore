import module namespace entities = "http://xbrl.io/modules/bizql/entities";
import module namespace companies = "http://xbrl.io/modules/bizql/profiles/sec/companies";
import module namespace request = "http://www.28msec.com/modules/http-request";
import module namespace csv = "http://zorba.io/modules/json-csv";

declare function local:to-xml($entities as object*) as element()*
{
  <Entities>{
    for $e in $entities
    return
    <Entity>
        <ID>{$e._id}</ID>
        <Profile name="{$e.Profiles.SEC.Name}">
            <CompanyName>{$e.Profiles.SEC.CompanyName}</CompanyName>
            <CompanyType>{$e.Profiles.SEC.CompanyType}</CompanyType>
            <SIC>{$e.Profiles.SEC.SIC}</SIC>
            <SICDescription>{$e.Profiles.SEC.SICDescription}</SICDescription>
            <SICGroup>{$e.Profiles.SEC.SICGroup}</SICGroup>
            <Sector>{$e.Profiles.SEC.Sector}</Sector>
            <IsTrust>{$e.Profiles.SEC.IsTrust}</IsTrust>    
            <Tickers>{
                for $t in $e.Profiles.SEC.Tickers[]
                return <Ticker>{$t}</Ticker>
            }</Tickers>
            <Tags>
            {
                for $t in $e.Profiles.SEC.Tags[]
                return <Tag>{$t}</Tag>
            }
            </Tags>
        </Profile>
    </Entity>
  }</Entities>
};

declare function local:to-csv($entities as object*) as string*
{
    csv:serialize(
        for $e in $entities
        return  {
            ID : $e._id,
            Profile : "SEC",
            CompanyName : $e.Profiles.SEC.CompanyName,
            CompanyType : $e.Profiles.SEC.CompanyType,
            SIC : $e.Profiles.SEC.SIC,
            SICDescription : $e.Profiles.SEC.SICDescription,
            SICGroup :$e.Profiles.SEC.SICGroup,
            Sector : $e.Profiles.SEC.Sector,
            IsTrust : $e.Profiles.SEC.IsTrust,
            Tickers : string-join($e.Profiles.SEC.Tickers[], " "),
            Tags : string-join($e.Profiles.SEC.Tags[], " ")
        }
    )
};

let $format  := lower-case(substring-after(request:path(), ".jq.")) (: text, xml, or json (default) :)
let $ciks    := request:param-values("cik")
let $tags    := request:param-values("tag") ! upper-case($$) (: DOW30, SP500, FORTUNE100 :)
let $tickers := request:param-values("ticker")
let $entities := 
    for $entity in 
        if (exists(($ciks, $tags, $tickers)))
        then
            for $entity in (companies:companies($ciks),
                       companies:companies-for-tags($tags),
                       companies:companies-for-tickers($tickers))
            group by companies:eid($entity) (: duplicate elimination :)
            return $entity[1]
        else
            entities:entities() (: companies:companies() ? :)
    order by $entity.Profiles.SEC.CompanyName (: companies:name() ? :)
    return $entity
return
    switch ($format)
        case "xml"  return local:to-xml($entities)
        case "text"  return string-join(local:to-csv($entities))
        default return [ $entities ]
