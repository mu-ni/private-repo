// new Vue({
//     el: '#app',
//     data: {
//         message: 'Test Vue.js!'
//     }
// })

function reviewClicked(value) {
        location.href = "/review?imgid=" + value;
    }

function checkClicked(value) {
        location.href = "/check?imgid=" + value;
    }

function nokClicked() {
        document.getElementById('okBtn').disabled = true;
        document.getElementById('reasonDiv').style.display = 'block';
    }

function radioClicked() {
            if(document.getElementById("reason1").checked || document.getElementById("reason2").checked || document.getElementById("reason3").checked){
                 document.getElementById('submitBtn').disabled = false;
            }else{
                document.getElementById('submitBtn').disabled = true;
            }
    }

function reviewNavClicked(page){
    clearListClass($("#reviewNavUl li:not('.eclipsis'):not('.first'):not('.last')"));
    document.getElementById('reviewNavUl').getElementsByTagName('li')[page].className += "active";
    updateContent("review", page, "reviewList");
}

function checkNavClicked(page){
    clearListClass($("#checkNavUl li:not('.eclipsis'):not('.first'):not('.last')"));
    document.getElementById('checkNavUl').getElementsByTagName('li')[page].className = "active";
    updateContent("check", page, "checkList");
}

function clearListClass(list){
    for (var i = 0; i < list.length; i++) {
        list[i].className = "";
    }
}

function updateContent(list, page, divId){
    $.ajax({
        type:'post',
        url: "/pageFlip?pageTo="+page,
        contentType: "application/json; charset=utf-8",
        dataType: 'json',
        data: "{'list' : '" + list + "','pageTo': '" + page + "'}",
        success: function (data) {
                $("#" + divId + " li.first").removeClass("disabled");
                $("#" + divId + " li.last").removeClass("disabled");

                if(data['imgList'].length < 10) {
                    for(var i=0; i<10; i++){
                        $("#" + divId + " tbody tr:eq("+ i +")").hide();
                    }
                }
                for(var i=0; i<data['imgList'].length; i++){
                    $("#" + divId + " tbody tr:eq("+ i +")").show();
                    $("#" + divId + " tbody tr:eq("+ i +") td:eq(0)").html((page-1)*10+i+1);
                    $("#" + divId + " tbody tr:eq("+ i +") td:eq(1)").html(data['imgList'][i]['packageId']);
                    $("#" + divId + " tbody tr:eq("+ i +") td:eq(2)").html(data['imgList'][i]['imgKey']);
                    $("#" + divId + " tbody tr:eq("+ i +") td:eq(3)").html(data['imgList'][i]['activationDate']);
                }
                if(page == 1){
                    $("#" + divId + " li.first").addClass("disabled");
                }
                if(page == data['maxPage']){
                    $("#" + divId + " li.last").addClass("disabled");
                }
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
                alert("Status: " + textStatus + "    Error:" + errorThrown + "    message:" + XMLHttpRequest.responseText);
        }
    });
}
