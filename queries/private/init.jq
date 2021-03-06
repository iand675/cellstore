import module namespace user = "http://apps.28.io/user";
import module namespace session = "http://apps.28.io/session";
import module namespace config = "http://apps.28.io/config";

if (is-available-collection($user:collection))
then ();
else create($user:collection);

if (is-available-collection($user:pictures))
then ();
else create($user:pictures);

if (is-available-collection($session:tokens))
then ();
else create($session:tokens);

if (is-available-collection($user:roles))
then truncate($user:roles);
else create($user:roles);

if (is-available-collection($user:rights))
then truncate($user:rights);
else create($user:rights);

if (is-available-collection("reportcache"))
then truncate("reportcache");
else create("reportcache");

if (is-available-collection("reportschemas"))
then ();
else create("reportschemas");

if (is-available-collection("reports"))
then ();
else create("reports");

if (is-available-collection("audit"))
then ();
else create("audit");

flush();

(: RIGHTS :)
user:new-right("rights", "Rights", (), 1);
user:new-right("settings", "Settings", "rights", 1);
user:new-right("users", "Users", "settings", 1);
user:new-right("roles", "Roles", "settings", 2);
user:new-right("reports", "Reports", "settings", 3);

(: RIGHTS: users :)
user:new-right("users_new", "Create New User", "users", 3);
user:new-right("users_list", "List All Users", "users", 2);
user:new-right("users_get", "View User", "users", 1);
user:new-right("users_get_self", "Get Profile", "users_get", 1);
user:new-right("users_edit", "Edit User", "users", 4);
user:new-right("users_edit_self", "Update Profile", "users_get_self", 1);
user:new-right("users_suspend", "Suspend User", "users_edit", 3);
user:new-right("users_activate", "Reactivate User", "users_edit", 2);
user:new-right("users_reset_password", "Reset Anybodys Password", "users", 4);
user:new-right("users_reset_password_self", "Reset Own Password", "users_get_self", 1);
user:new-right("users_upload_picture", "Upload User Picture", "users_edit", 4);
user:new-right("users_upload_picture_self", "Upload Profile Picture", "users_edit_self", 1);
user:new-right("users_remove_picture", "Remove User Picture", "users_edit", 4);
user:new-right("users_remove_picture_self", "Remove Profile Picture", "users_edit_self", 2);

(: RIGHTS: roles :)
user:new-right("users_assign_role","Assign Role to User","roles", 4);
user:new-right("users_close_assignment","Close Role Assignment of User","roles", 5);
user:new-right("roles_list","List All Roles and Rights","roles", 1);
user:new-right("roles_new","Create New Role","roles", 2);
user:new-right("roles_change_permissions","Change Permissions for Roles","roles", 3);

(: RIGHTS: reports :)
user:new-right("reports_get", "View Report", "reports", 1);
user:new-right("reports_validate", "Validate a Report", "reports", 2);
user:new-right("reports_edit", "Edit Report", "reports", 3);
user:new-right("reports_create", "Create a new Report", "reports_edit", 1);
user:new-right("reports_remove", "Remove Report", "reports_edit", 2);

(: RIGHTS: Data :)
user:new-right("data", "Data Access", (), 1);
user:new-right("data_sec", "SEC data access", "data", 1);

(: ROLES :)
user:new-role("admin", "Administrator");
user:new-role("anybody", "All Users");
user:new-role("sec_enterprise", "Paid users (SEC Enterprise)");

flush();

(: assign ROLES -> RIGHTS :)
user:allow("admin", "rights");
user:allow("admin", "data");
user:allow("anybody", "users_get_self");
user:allow("anybody", "users_reset_password_self");
user:allow("anybody", "users_upload_picture_self");
user:allow("anybody", "users_edit_self");
user:allow("anybody", "users_remove_picture_self");
user:allow("anybody", "reports");
user:allow("sec_enterprise", "data_sec");
user:allow("anybody", "data_sec");

(: Pro user :)
variable $user-id as string? := user:get-by-email($config:test-user)._id;
if(empty($user-id))
then {
    $user-id := user:new($config:test-user, "System", "Administrator", $config:test-password, {| |});
  }
else ();

(: test user token for tests :)
let $token :=
{
  "_id" : $config:test-token,
  "user-id" : $user-id,
  "expiration-date" : xs:dateTime("2018-10-20T22:17:23.851315Z"),
  "token-type": $session:TOKEN-TYPE-APP
}
let $existing := db:collection("Tokens")[$$."user-id" eq $user-id and $$."_id" eq $token."_id"]
return
  if(exists($existing))
  then ();
  else db:insert("Tokens", $token);

(: Disclosures Token :)
let $token := collection("Tokens")[$$."expiration-date" eq xs:dateTime("2016-09-12T22:17:23.851315Z")
and $$."user-id" eq $user-id]
return 
if(empty($token))
then session:start($user-id, xs:dateTime("2016-09-12T22:17:23.851315Z"), $session:TOKEN-TYPE-APP);
else ();

(: Admin user :)
variable $admin := user:get-by-email($config:admin-user);
if(empty($admin))
then {
    $admin := user:new($config:admin-user, "System", "Administrator", $config:admin-password, {| |});
    user:assign-role($admin, "admin", (), (), $admin);
  }
else ();

(: remove user that is created in the e2e registration-scenario tests. :)
variable $testUser := user:get-by-email("admin+test@28msec.com");
if(empty($testUser))
then ();
else db:delete($testUser);
