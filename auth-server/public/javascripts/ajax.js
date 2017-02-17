$("[name='status']").bootstrapSwitch();
$("[name='umaCompliant']").bootstrapSwitch();

/*function clientEmpty(){
    var clientName = $("[name='clientName']").val();
    var clientType = $("[name='clientType']").val();
    if(clientName=="" && clientType==""){
        $("[name='clientName']").css("border","1px solid red");
        $("[name='clientType']").css("border","1px solid red");
        return false;
    }else if(clientName!="" && clientType==""){
        $("[name='clientName']").css("border","1px solid #ccc");
        $("[name='clientType']").css("border","1px solid red");
        return false;
    }else if(clientName=="" && clientType!=""){
        $("[name='clientName']").css("border","1px solid red");
        $("[name='clientType']").css("border","1px solid #ccc");
        return false;
    }else{
        return true;
    }
}*/

/*function areEmpty(){
    var serverName = $("#formAddResourceServer [name='serverName']").val();
    var serverUser = $("#formAddResourceServer [name='serverUser']").val();
    var serverUrl = $("#formAddResourceServer [name='serverUrl']").val();
    if(serverName==""){
        $("#formAddResourceServer [name='serverName']").css("border","1px solid red");
        $("#formAddResourceServer [name='serverUser']").css("border","1px solid #ccc");
        $("#formAddResourceServer [name='serverUrl']").css("border","1px solid #ccc");
        return false;
    }else if(serverUser==""){
        $("#formAddResourceServer [name='serverName']").css("border","1px solid #ccc");
        $("#formAddResourceServer [name='serverUser']").css("border","1px solid red");
        $("#formAddResourceServer [name='serverUrl']").css("border","1px solid #ccc");
        return false;
    }else if(serverUrl==""){
        $("#formAddResourceServer [name='serverName']").css("border","1px solid #ccc");
        $("#formAddResourceServer [name='serverUser']").css("border","1px solid #ccc");
        $("#formAddResourceServer [name='serverUrl']").css("border","1px solid red");
        return false;
    }
    else{
        return true;
    }
}*/

function checkSignup(){
    var username = $("#signupForm [name='username']").val();
    var password = $("#signupForm [name='password']").val();
    var rePassword = $("#signupForm [name='rePassword']").val();
    var name = $("#signupForm [name='name']").val();
    var email = $("#signupForm [name='email']").val();
    if(username==""||password==""||rePassword==""||name==""||email==""){
        alert('Please fill all fields!!');
        return false;
    }
}

function checkProfile(){
    var name = $("#profileForm [name='name']").val();
    var email = $("#profileForm [name='email']").val();
    if(name==""||email==""){
        alert('Name and email can not empty!!');
        return false;
    }
}

function checkLogin(){
    var username = $("#loginForm [name='username']").val();
    var password = $("#loginForm [name='password']").val();
    if(username==""||password==""){
        alert('Username and password can not empty!!');
        return false;
    }
}

function checkChangePsw(){
    var password = $("#changePswForm [name='password']").val();
    var newPassword = $("#changePswForm [name='newPassword']").val();
    var reNewPassword = $("#changePswForm [name='reNewPassword']").val();
    if(password==""||newPassword==""||reNewPassword==""){
        alert('Password can not empty!!');
        return false;
    }
}

$(document).ready(function(){
    /*$("#formAddPermission [name='resource']").change(function(){
        var resourceName=$("#formAddPermission [name='resource']").val();
        $.ajax({
            type:'post',
            url: '/showActionsResourceServer',
            data: {resourceName:resourceName},
            dataType: 'json',
            success: function (data) {
                $("#showActions").empty();
                for(var i=0;i<data.actions.length;i++){
                    //alert(data[i]);
                    $("#showActions").append("<input id='Actions' type='checkbox' name='actions' value="+data.actions[i]+">" +
                    "<span style='margin-right:10px'>"+data.actions[i]+"</span>");
                }
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                alert("Status: " + textStatus + "    Error:" + errorThrown);
            }
        });
    });*/

    $("#formAddPermission [name='resource']").change(function(){
        var resourceId = $("#formAddPermission [name='resource']").val();
        $.ajax({
            type:'post',
            url: '/resourceChange',
            data: {resourceId : resourceId},
            dataType: 'json',
            success: function (data) {
                //for resource ID
                //$("#showResourceID").empty();
                //$("#showResourceID").append("<input id='ResourceID' name='resourceID' class='form-control' value="+data.resource._id+">");
                //for client id
                //$("#showClient_id").empty();
                //$("#showClient_id").append("<input id='Client_id' name='client_id' class='form-control' value="+data.client_id+">");
                //for client ID
                //$("#showClientID").empty();
                //$("#showClientID").append("<input id='ClientID' name='clientID' class='form-control' value="+data.clients[0]._id+">");
                //for actions
                $("#showActions").empty();
                for(var i=0;i<data.resource.actions.length;i++){
                    $("#showActions").append("<input id='Actions' type='checkbox' name='actions' value="+data.resource.actions[i]+">" +
                    "<span style='margin-right:10px'>"+data.resource.actions[i]+"</span>");
                }
                //for server
                //$("#showServerID").empty();
                //$("#showServerID").append("<input id='ServerID' name='serverID' class='form-control' value="+data.resource.serverId+">");
                //for clients
                $("#client").empty();
                for(var i=0;i<data.clients.length;i++){
                    $("#client").append("<option value="+data.clients[i]._id+">"+data.clients[i].clientName+"</option>");
                }
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                alert("Status: " + textStatus + "    Error:" + errorThrown + "    message:" + XMLHttpRequest.responseText);
            }
        });
    });

    /*$("#formAddPermission [name='client']").change(function(){
        var clientName=$("#formAddPermission [name='client']").val();
        $.ajax({
            type:'post',
            url: '/clientChange',
            data: {clientName:clientName},
            dataType: 'json',
            success: function (data) {
                //for client ID
                $("#showClientID").empty();
                $("#showClientID").append("<input id='ClientID' name='clientID' class='form-control' value="+data.clientID+">");
                //for resource
                /*$("#resource").empty();
                for(var i=0;i<data.resources.length;i++){
                    $("#resource").append("<option>"+data.resources[i].resourceName+"</option>");
                }*/
                //for client id
                /*$("#showClient_id").empty();
                $("#showClient_id").append("<input id='Client_id' name='client_id' class='form-control' value="+data.client_id+">");*/
            /*},
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                alert("Status: " + textStatus + "    Error:" + errorThrown + "    message:" + XMLHttpRequest.responseText);
            }
        });
    });*/

    //merge clients
    $("#MergeClients").click(function(){
        $("td.index").hide();
        $("td.merge").css({"display": "block"});
        //$("td.index").html("<input type='checkbox' name='mergeClients' value="+id+">");
        $("a#MergeClients").hide();
        $("div#ButtonContainer").html("<a class='btn btn-default' href='/client' style='margin-right: 5px'>Cancel</a>"+
        "<a id='Merge' class='btn btn-success')>Merge Clients</a>");
    });

    //add resource set
    $("#ResourceSet").click(function(){
        $("td.index").hide();
        $("td.resourceSet").css({"display": "block"});
        $("a#ResourceSet").hide();
        $("div#ButtonContainer").html("<a class='btn btn-default' href='/resource' style='margin-right: 5px'>Cancel</a>"+
        "<a id='Set' class='btn btn-success')>Add Resource Set</a>");
    });

    $(document).on("click","#Set",function(){
        var resources = $(".resourceSet [name='setCheck']:checked").map(function() {
            return this.value;
        }).get();
        if(resources.length < 2){return alert('Must select 2 or more resources!')}
        var conformSet = confirm('Are you sure to put selected resources into a set?');
        $.ajax({
            type:'post',
            url: '/resourece-set',
            data: {resources:resources},
            dataType: 'json',
            success: function (data) {
                window.location.href = '/resource'
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                alert("Status: " + textStatus + "    Error:" + errorThrown + "    message:" + XMLHttpRequest.responseText);
            }
        });

    });

    $(document).on("click","#Merge",function(){
        var clients = $(".merge [name='mergeCheck']:checked").map(function() {
            return this.value;
        }).get();
        if(clients.length < 2){return alert('Must select 2 or more clients!')}
        var conformMerge = confirm('Are you sure to merge selected clients?');
        if(conformMerge==true){
            $.ajax({
                type:'post',
                url: '/merge-clients',
                data: {clients:clients},
                dataType: 'json',
                success: function (data) {
                    console.log('success!')
                    window.location.href = '/client'//session.success
                    /*var serverName = ''
                     for(var i=0;i<data.serverName.length;i++){
                     serverName +='serverName[]='+data.serverName[i]+'&'
                     }
                     var removeId = ''
                     for(var i=0;i<clients.length;i++){
                     removeId +='removeId[]='+clients[i]+'&'
                     }
                     window.location.href = '/merge-clients?'+serverName+removeId+'type='+data.type;*/
                },
                error: function (XMLHttpRequest, textStatus, errorThrown) {
                    alert("Status: " + textStatus + "    Error:" + errorThrown + "    message:" + XMLHttpRequest.responseText);
                }
            });
        }else{
            window.location.href = '#'
        }

    });

    $(".merge [name='mergeCheck']").change(function(){
        var value = $(".merge [name='mergeCheck']:checked").map(function() {
            return this.value;
        }).get();//select all checked value//array
        //var value = $(".merge [name='mergeCheck']:checked").val();
        $.ajax({
         type:'post',
         url: '/check-server',
         data: {value:value},
         dataType: 'json',
         success: function (data) {//array, json inside//clients with same server
             if(data===null){//all clients available
                 $(".merge").children("[name='mergeCheck']").each(function(){
                     $(this).attr("disabled", false);
                 });
             }else{
                 $(".merge").children("[name='mergeCheck']").each(function(){
                     for(var i=0;i<data.length;i++){
                         if(data[i]._id===$(this).val()){
                             $(this).attr("disabled", true);
                         }
                     }
                 })
             }
         },
         error: function (XMLHttpRequest, textStatus, errorThrown) {
            alert("Status: " + textStatus + "    Error:" + errorThrown + "    message:" + XMLHttpRequest.responseText);
         }
         });
    });

    $("#formAddClient [name='tokenType']").change(function(){
        var tokenType=$("#formAddClient [name='tokenType']").val();
        if(tokenType==='certificate'){
            $("#formAddClient #showPinCode").css("display","block");
        }
        else{
            $("#formAddClient #showPinCode").css("display","none");
        }
    });

    //reset client_id & client_secret
    $("#formEditResourceServer .reset").click(function(){
        $.ajax({
            type:'post',
            url: '/resource-server/reset',
            data: {},
            dataType: 'json',
            success: function (data) {
                $("#client_id").html(data.client_id)
                $("#client_secret").html(data.client_secret)
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                alert("Status: " + textStatus + "    Error:" + errorThrown + "    message:" + XMLHttpRequest.responseText);
            }
        });
    });

});

/**
 * Created by nmu on 07/04/2015.
 */
