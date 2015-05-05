





function forward() {
    onAnimate(document.querySelector('.bd-page-container'), 0,1);
}

function backward() {
    onAnimate(document.querySelector('.bd-page-container'), 1,0);
}


function hasClass(ele,cls) {
  return !!ele.className.match(new RegExp('(\\s|^)'+cls+'(\\s|$)'));
}

function addClass(ele,cls) {
  if (!hasClass(ele,cls)) ele.className += " "+cls;
}

function removeClass(ele,cls) {
  if (hasClass(ele,cls)) {
    var reg = new RegExp('(\\s|^)'+cls+'(\\s|$)');
    ele.className=ele.className.replace(reg,' ');
  }
}

//http://toddmotto.com/ditch-the-array-foreach-call-nodelist-hack/
var forEach = function (array, callback, scope) {
  for (var i = 0; i < array.length; i++) {
    callback.call(scope, i, array[i]); // passes back stuff we need
  }
};


document.querySelector('.top-bg').addEventListener('click', function () {
    backward();
});


var albums = document.querySelectorAll('.album-list div');

forEach(albums, function (index, album) {
    console.log(album);
    album.addEventListener('click', function (evt) {
        forEach(albums, function (index, album) {
            album.removeAttribute('data-animation-id');
        });
        evt.currentTarget.setAttribute('data-animation-id','user-image');
        console.log("BG",evt.currentTarget.style.background);
        forward();
    });
});



function onAnimate(container, fromPageIndex, toPageIndex) {
    
    var itemsToReset = [];
    var toPageTransitionDone = false;
    var cleanUpAfterToPageDone = [];
    
    var cleanupElementTranisiton = function (data) {
        data.fromElement.style.visibility = "visible";
        data.toElement.style.visibility = "visible";
        container.removeChild(data.target);
    }
    
    var getEasingClass = function (el, attr) {
        // This seems like a very stupid way to do window['Back']['easeOut']
        var classPath;
        if (el.hasAttribute(attr)) {
            var arr = el.getAttribute(attr).split('.');
            classPath = window;
            arr.forEach(function(part) {
                classPath = classPath[part];
            });
        }
        return classPath;
    }
    
    
    var elementAnimations = [];
    var fromPage = document.querySelector(".bd-page[data-index='"+fromPageIndex+"']");
    var toPage = document.querySelector(".bd-page[data-index='"+toPageIndex+"']");
    
    var containerWidth = window.getComputedStyle(container).width;
    var w = parseInt(containerWidth);
    
    var onTransitionDone = function () {        
        fromPage.style.visibility = "hidden";
        alert("All Done");
        itemsToReset.forEach(function (item) {
            //TweenMax.set(item, {clearProps:"all"});
        });
    }
    
    
    var transitionTimeline = new TimelineMax({onComplete:onTransitionDone});
    
    // Page Transition
    var fromIndex = Number(fromPage.getAttribute('data-index'));
    var toIndex = Number(toPage.getAttribute('data-index'));
    var toProps = {x:0};
    var easeFunc = getEasingClass(toPage, 'data-animation-easing');
    if (easeFunc) {
        toProps.ease = easeFunc;
    }
    
    var fromProps = {x:w};
    if(fromIndex > toIndex) {
        fromProps.x = -w;   
    }
    
    toProps.onComplete = function () {
        toPageTransitionDone = true;
        for(var i=0;i<cleanUpAfterToPageDone.length;i++) {
            var data = cleanUpAfterToPageDone[i];
            cleanupElementTranisiton(data);
        }
    }
    
    var delay = fromPage.getAttribute('data-animation-delay') || 0;
    //alert("Delay "+delay);
    
    transitionTimeline.fromTo(toPage, 0.8, fromProps, toProps, delay);
    
    var toProps = {x:-w};
    if(fromIndex > toIndex) {
        toProps.x = w;   
    }
    
    var easeFunc = getEasingClass(fromPage, 'data-animation-easing');
    if (easeFunc) {
        toProps.ease = easeFunc;
    }
    transitionTimeline.fromTo(fromPage, 0.8, {x:0}, toProps, 0);
    
    
    

    // Individual Element transitions (fadeIn/fadeOut... no element to element trasitions)
    var outAnimations = fromPage.querySelectorAll('*[data-animation-out]');
    forEach(outAnimations, function (index, value) {
        itemsToReset.push(value);
        transitionTimeline.fromTo(value, 0.8, {opacity:1}, {opacity:0}, 0);
    });
    
    var inAnimations = toPage.querySelectorAll('*[data-animation-in]');
    forEach(inAnimations, function (index, value) {
        itemsToReset.push(value);
        var properties = value.getAttribute('data-animation-in');
        var properties = properties.split(";");
        var rules = {};
        for(var i=0;i<properties.length;i++) {
            var parts = properties[i].split(':');
            if(parts.length===2) {
                rules[parts[0]] = parts[1];
            }
        }
        console.log("Properties", properties);
        console.log("rules", rules );
        var delay = rules.delay || 0;
        
        transitionTimeline.fromTo(value, 0.8, {opacity:0}, {opacity:1}, delay);
    });
    
    // Element to Element transitions
    
    var elementsFromPage = fromPage.querySelectorAll('*[data-animation-id]');
    var elementsFromAnimationIds = {};
    for (i = 0; i < elementsFromPage.length; ++i) {
        var val = elementsFromPage[i].getAttribute('data-animation-id');
        elementsFromAnimationIds[val] = elementsFromPage[i];
    }
    
    var elementsToPage = toPage.querySelectorAll('*[data-animation-id]');
    for (i = 0; i < elementsToPage.length; ++i) {
        var val = elementsToPage[i].getAttribute('data-animation-id');
        if (elementsFromAnimationIds[val]) {
            elementAnimations.push({fromElement: elementsFromAnimationIds[val], toElement: elementsToPage[i]});
        }
    }
    
    
    
    var staggerGroups = {};
    var staggerElements = toPage.querySelectorAll('*[data-animation-stagger-group]');
    forEach(staggerElements, function (index, element) {
        var groupName = element.getAttribute('data-animation-stagger-group');
        if(!staggerGroups[groupName]) {
            staggerGroups[groupName] = [];
        }
        staggerGroups[groupName].push(element);
    });
    
    for(var i in staggerGroups) {
     transitionTimeline.staggerFrom(staggerGroups[i], 2, {scale:0.5, opacity:0, delay:0.0, ease:Elastic.easeOut, force3D:true}, 0.2, 0);   
        
    }
    
    
    toPage.style.visibility = "visible";
    //addClass(toPage, "pt-page-moveFromLeft");
    
    
    
    var animateTargets = function (animationTargets, toPage, fromPage) {
        
        // clone from element
        
        console.log("From Positions: "+animationTargets.fromElement.offsetLeft+"  "+animationTargets.fromElement.offsetTop);
        console.log("To Positions: "+animationTargets.toElement.offsetLeft+"  "+animationTargets.toElement.offsetTop);

        var targetClone = animationTargets.fromElement.cloneNode(true);
        
        var stylesToApplyToTarget = animationTargets.fromElement.getAttribute('data-animation-copy-style');
        if (stylesToApplyToTarget) {
            animationTargets.toElement.style[stylesToApplyToTarget] = animationTargets.fromElement.style[stylesToApplyToTarget];
        }
        
        // Set initial position of the clone
        targetClone.style.margin = "0";
        targetClone.style.padding = "0";
        targetClone.style.position = "absolute";
        targetClone.style.left = animationTargets.fromElement.offsetLeft + "px";
        targetClone.style.top = animationTargets.fromElement.offsetTop + "px";
        //targetClone.style['background-size'] = animationTargets.fromElement.style['background-size'];
        
        animationTargets.fromElement.style.visibility = "hidden";
        animationTargets.toElement.style.visibility = "hidden";
        container.appendChild(targetClone);
        toPage.style.visibility = "visible"; 
        
        var targetCompouted = window.getComputedStyle(animationTargets.toElement);
        
        
        var cleanupElementTranisiton = function (data) {
            data.fromElement.style.visibility = "visible";
            data.toElement.style.visibility = "visible";
            container.removeChild(data.target);
        }
        
        
        var onComplete = function (target, fromElement, toElement) {
            console.log("Item animation complete");
            var data = {fromElement: fromElement, toElement:toElement, target: target};
            if (toPageTransitionDone) {
                cleanupElementTranisiton(data);
            } else {
                cleanUpAfterToPageDone.push(data);   
            }
        };
        
        var properties = {
            left: animationTargets.toElement.offsetLeft+"px",
            top: animationTargets.toElement.offsetTop+"px",
            width: targetCompouted["width"],
            height: targetCompouted["height"],
            'border-radius': targetCompouted["border-radius"],
            //background: targetCompouted.background,
            onComplete: onComplete,
            onCompleteParams: [targetClone, animationTargets.fromElement, animationTargets.toElement]
        }      
        

        
        var easeFunc = getEasingClass(animationTargets.fromElement, 'data-animation-easing');
        if (easeFunc) {
            properties.ease = easeFunc;   
        }
            
        var delay = animationTargets.fromElement.getAttribute('data-animation-delay') || 0;
        console.warn("Delay " + delay);
        
        transitionTimeline.to(targetClone, 0.8, properties, delay);
    }
    
    
    
    for(var i=0;i<elementAnimations.length;i++) {
        animateTargets(elementAnimations[i], toPage, fromPage);
    }
    
    
    
    console.log("Elements to animate ", elementAnimations);
    
    
}