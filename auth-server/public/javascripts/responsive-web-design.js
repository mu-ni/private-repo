$(document).ready(function(){
    $(".navbar-fixed-top .token").mouseover(function(){
        $(".flyout").css("display","block");
    });

    $(".flyout").mouseover(function(){
        $(".flyout").css("display","block");
    });

    $(".navbar-fixed-top .token").mouseleave(function(){
        $(".flyout").css("display","none");
    });

    $(".flyout").mouseleave(function(){
        $(".flyout").css("display","none");
    });
})
/**
 * Created by nmu on 15/07/2015.
 */
