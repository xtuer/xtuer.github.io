$(document).ready(function() {
    main();
});

function main() {
	var isMobileInit = false;
	// var loadMobile = function(){
	// 	require(['/js/mobile.js'], function(mobile){
	// 		mobile.init();
	// 		isMobileInit = true;
	// 	});
	// }
	var isPCInit = false;
	// var loadPC = function(){
	// 	require(['/js/pc.js'], function(pc){
	// 		pc.init();
	// 		isPCInit = true;
	// 	});
	// }

	var browser={
	    versions:function(){
	    var u = window.navigator.userAgent;
	    return {
	        trident: u.indexOf('Trident') > -1, //IE内核
	        presto: u.indexOf('Presto') > -1, //opera内核
	        webKit: u.indexOf('AppleWebKit') > -1, //苹果、谷歌内核
	        gecko: u.indexOf('Gecko') > -1 && u.indexOf('KHTML') == -1, //火狐内核
	        mobile: !!u.match(/AppleWebKit.*Mobile.*/), //是否为移动终端
	        ios: !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/), //ios终端
	        android: u.indexOf('Android') > -1 || u.indexOf('Linux') > -1, //android终端或者uc浏览器
	        iPhone: u.indexOf('iPhone') > -1 || u.indexOf('Mac') > -1, //是否为iPhone或者安卓QQ浏览器
	        iPad: u.indexOf('iPad') > -1, //是否为iPad
	        webApp: u.indexOf('Safari') == -1 ,//是否为web应用程序，没有头部与底部
	        weixin: u.indexOf('MicroMessenger') == -1 //是否为微信浏览器
	        };
	    }()
	}

	$(window).bind("resize", function(){
		if(isMobileInit && isPCInit){
			$(window).unbind("resize");
			return;
		}
		var w = $(window).width();
		if(w >= 700){
            // loadPC();
            __pc().init();
            isMobileInit = true;
		}else{
            // loadMobile();
            __mobile().init();
            isMobileInit = true;
		}
	});

	if(browser.versions.mobile === true || $(window).width() < 700){
        // loadMobile();
        __mobile().init();
        isMobileInit = true;
	}else{
        // loadPC();
        __pc().init();
        isMobileInit = true;
	}

	//是否使用fancybox
	if(yiliaConfig.fancybox === true){
		require(['/fancybox/jquery.fancybox.js'], function(pc){
			var isFancy = $(".isFancy");
			if(isFancy.length != 0){
				var imgArr = $(".article-inner img");
				for(var i=0,len=imgArr.length;i<len;i++){
					var src = imgArr.eq(i).attr("src");
					var title = imgArr.eq(i).attr("alt");
					imgArr.eq(i).replaceWith("<a href='"+src+"' title='"+title+"' rel='fancy-group' class='fancy-ctn fancybox'><img src='"+src+"' title='"+title+"'></a>");
				}
				$(".article-inner .fancy-ctn").fancybox();
			}
		});

	}
	//是否开启动画
	if(yiliaConfig.animate === true){

		require(['/js/jquery.lazyload.js'], function(){
			//avatar
			$(".js-avatar").attr("src", $(".js-avatar").attr("lazy-src"));
			$(".js-avatar")[0].onload = function(){
				$(".js-avatar").addClass("show");
			}
		});

		if(yiliaConfig.isHome === true){
			//content
			function showArticle(){
				$(".article").each(function(){
					if( $(this).offset().top <= $(window).scrollTop()+$(window).height() && !($(this).hasClass('show')) ) {
						$(this).removeClass("hidden").addClass("show");
						$(this).addClass("is-hiddened");
					}else{
						if(!$(this).hasClass("is-hiddened")){
							$(this).addClass("hidden");
						}
					}
				});
			}
			$(window).on('scroll', function(){
				showArticle();
			});
			showArticle();
		}

	}

	//是否新窗口打开链接
	if(yiliaConfig.open_in_new == true){
		$(".article a[href]").attr("target", "_blank")
	}
}

function __pc() {
	var Tips = (function(){

		var $tipBox = $(".tips-box");

		return {
			show: function(){
				$tipBox.removeClass("hide");
			},
			hide: function(){
				$tipBox.addClass("hide");
			},
			init: function(){

			}
		}
	})();

	var resetTags = function(){
		var tags = $(".tagcloud a");
		tags.css({"font-size": "12px"});
		for(var i=0,len=tags.length; i<len; i++){
			var num = tags.eq(i).html().length % 5 +1;
			tags[i].className = "";
			tags.eq(i).addClass("color"+num);
		}
	}

	var slide = function(idx){
		var $wrap = $(".switch-wrap");
		$wrap.css({
			"transform": "translate(-"+idx*100+"%, 0 )"
		});
		$(".icon-wrap").addClass("hide");
		$(".icon-wrap").eq(idx).removeClass("hide");
	}

	var bind = function(){
		var switchBtn = $("#myonoffswitch");
		var tagcloud = $(".second-part");
		var navDiv = $(".first-part");
		switchBtn.click(function(){
			if(switchBtn.hasClass("clicked")){
				switchBtn.removeClass("clicked");
				tagcloud.removeClass("turn-left");
				navDiv.removeClass("turn-left");
			}else{
				switchBtn.addClass("clicked");
				tagcloud.addClass("turn-left");
				navDiv.addClass("turn-left");
				resetTags();
			}
		});

		var timeout;
		var isEnterBtn = false;
		var isEnterTips = false;

		$(".icon").bind("mouseenter", function(){
			isEnterBtn = true;
			Tips.show();
		}).bind("mouseleave", function(){
			isEnterBtn = false;
			setTimeout(function(){
				if(!isEnterTips){
					Tips.hide();
				}
			}, 100);
		});

		$(".tips-box").bind("mouseenter", function(){
			isEnterTips = true;
			Tips.show();
		}).bind("mouseleave", function(){
			isEnterTips = false;
			setTimeout(function(){
				if(!isEnterBtn){
					Tips.hide();
				}
			}, 100);
		});

		$(".tips-inner li").bind("click", function(){
			var idx = $(this).index();
			slide(idx);
			Tips.hide();
		});
	}

	return {
		init: function(){
			resetTags();
			bind();
			Tips.init();
		}
	}
}

function __mobile(){
	var _isShow = false;
	var $tag, $aboutme, $friends;

	var ctn,radio,scaleW,idx,basicwrap;

	//第一步 -- 初始化
	var reset = function() {
		//设定窗口比率
		radio = document.body.scrollHeight/document.body.scrollWidth;
		//设定一页的宽度
		scaleW = document.body.scrollWidth;
		//设定初始的索引值
		idx = 0;
	};
	//第一步 -- 组合
	var combine = function(){
		if($tag){
			document.getElementById("js-mobile-tagcloud").innerHTML = $tag.innerHTML;
		}
		if($aboutme){
			document.getElementById("js-mobile-aboutme").innerHTML = $aboutme.innerHTML;
		}
		if($friends){
			document.getElementById("js-mobile-friends").innerHTML = $friends.innerHTML;
		}
	}
	//第三步 -- 根据数据渲染DOM
	var renderDOM = function(){
		//生成节点
		var $viewer = document.createElement("div");
		$viewer.id = "viewer";
		$viewer.className = "hide";
		$tag = document.getElementById("js-tagcloud");
		$aboutme = document.getElementById("js-aboutme");
		$friends = document.getElementById("js-friends");
		var tagStr = $tag?'<span class="viewer-title">标签</span><div class="viewer-div tagcloud" id="js-mobile-tagcloud"></div>':"";
		var friendsStr = $friends?'<span class="viewer-title">友情链接</span><div class="viewer-div friends" id="js-mobile-friends"></div>':"";
		var aboutmeStr = $aboutme?'<span class="viewer-title">关于我</span><div class="viewer-div aboutme" id="js-mobile-aboutme"></div>':"";

		$viewer.innerHTML = '<div id="viewer-box">\
		<div class="viewer-box-l">\
			<div class="viewer-box-wrap">'+aboutmeStr+friendsStr+tagStr+'</div>\
		</div>\
		<div class="viewer-box-r"></div>\
		</div>';

		//主要图片节点
		document.getElementsByTagName("body")[0].appendChild($viewer);
		var wrap = document.getElementById("viewer-box");
		basicwrap = wrap;
		wrap.style.height = document.body.scrollHeight + 'px';
	};

	var show = function(target, idx){
		document.getElementById("viewer").className = "";
		setTimeout(function(){
			basicwrap.className = "anm-swipe";
		},0);
		_isShow = true;
		document.ontouchstart=function(e){
			if(e.target.tagName != "A"){
				return false;
			}
		}
	}

	var hide = function(){
		document.getElementById("viewer-box").className = "";
		_isShow = false;
		document.ontouchstart=function(){
			return true;
		}
	}

	//第四步 -- 绑定 DOM 事件
	var bindDOM = function(){
		var scaleW = scaleW;

		//滑动隐藏
		document.getElementById("viewer-box").addEventListener("webkitTransitionEnd", function(){

			if(_isShow == false){
				document.getElementById("viewer").className = "hide";
				_isShow = true;
			}else{
			}

		}, false);

		//点击展示和隐藏
		ctn.addEventListener("touchend", function(){
			show();
		}, false);

		var $right = document.getElementsByClassName("viewer-box-r")[0];
		var touchStartTime;
		var touchEndTime;
		$right.addEventListener("touchstart", function(){
			touchStartTime = + new Date();
		}, false);
		$right.addEventListener("touchend", function(){
			touchEndTime = + new Date();
			if(touchEndTime - touchStartTime < 300){
				hide();
			}
			touchStartTime = 0;
			touchEndTime = 0;
		}, false);

		//滚动样式
		var $overlay = $("#mobile-nav .overlay");
		var $header = $(".js-mobile-header");
		window.onscroll = function(){
		    var scrollTop = document.documentElement.scrollTop + document.body.scrollTop;
		    if(scrollTop >= 69){
		    	$overlay.addClass("fixed");
		    }else{
		    	$overlay.removeClass("fixed");
		    }
		    if(scrollTop >= 160){
		    	$header.removeClass("hide").addClass("fixed");
		    }else{
		    	$header.addClass("hide").removeClass("fixed");
		    }
		};
		$header[0].addEventListener("touchstart", function(){
			$('html, body').animate({scrollTop:0}, 'slow');
		}, false);
	};

	var resetTags = function(){
		var tags = $(".tagcloud a");
		tags.css({"font-size": "12px"});
		for(var i=0,len=tags.length; i<len; i++){
			var num = tags.eq(i).html().length % 5 +1;
			tags[i].className = "";
			tags.eq(i).addClass("color"+num);
		}
	}

	return{
		init: function(){
			//构造函数需要的参数
			ctn = document.getElementsByClassName("slider-trigger")[0];
			//构造四步
			reset();
			renderDOM();
			combine();
			bindDOM();
			resetTags();
		}
	}
}
