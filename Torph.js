var realStyle = function (_elem, _style) {
    var computedStyle;
    if (typeof _elem.currentStyle != 'undefined') {
        computedStyle = _elem.currentStyle;
    } else {
        computedStyle = document.defaultView.getComputedStyle(_elem, null);
    }

    return _style ? computedStyle[_style] : computedStyle;
};

var copyComputedStyle = function (src, dest) {
    var s = realStyle(src);
    for (var i in s) {
        // Do not use `hasOwnProperty`, nothing will get copied
        if (typeof i == "string" && i != "cssText" && !/\d/.test(i)) {
            // The try is for setter only properties
            try {
                dest.style[i] = s[i];
                // `fontSize` comes before `font` If `font` is empty, `fontSize` gets
                // overwritten.  So make sure to reset this property. (hackyhackhack)
                // Other properties may need similar treatment
                if (i == "font") {
                    dest.style.fontSize = s.fontSize;
                }

                if (i === "height") {
                    console.warn(s[i]);
                }
            } catch (e) {}
        }
    }
};




function Torph(container) {
    this.transitionTimeline;
    this.container = container;
    this.toPageTransitionDone = true;
    this.cleanUpAfterToPageDone = [];
    this.containerWidth = 0;
    var self = this;
    this.transitionFunctions = {};
    console.log("Container ", this.container);

    function moveLeftRight(fromIndex, toIndex) {
        var containerWidth = parseInt(window.getComputedStyle(container).width);
        var fromPageStartValues = {
            x: 0
        };
        var fromPageEndValues = {
            x: -containerWidth
        };
        var toPageStartValues = {
            x: containerWidth
        };
        var toPageEndValues = {
            x: 0
        };

        if (fromIndex > toIndex) {
            toPageStartValues.x = -containerWidth;
        }

        if (fromIndex > toIndex) {
            fromPageEndValues.x = containerWidth;
        }

        return {
            fromPageStartValues: fromPageStartValues,
            fromPageEndValues: fromPageEndValues,
            toPageStartValues: toPageStartValues,
            toPageEndValues: toPageEndValues
        }

    }
    this.transitionFunctions['move-left-right'] = moveLeftRight;

    function moveTopBottom(fromIndex, toIndex, container) {
        var containerHeight = parseInt(window.getComputedStyle(container).height);
        var fromPageStartValues = {
            y: 0
        };
        var fromPageEndValues = {
            y: -containerHeight
        };
        var toPageStartValues = {
            y: containerHeight
        };
        var toPageEndValues = {
            y: 0
        };

        if (fromIndex > toIndex) {
            toPageStartValues.y = -containerHeight;
        }

        if (fromIndex > toIndex) {
            fromPageEndValues.y = containerHeight;
        }

        return {
            fromPageStartValues: fromPageStartValues,
            fromPageEndValues: fromPageEndValues,
            toPageStartValues: toPageStartValues,
            toPageEndValues: toPageEndValues
        }

    }

    this.transitionFunctions['move-top-bottom'] = moveTopBottom;


}


Torph.prototype.registerPageTransition = function (transitionName, func) {
    this.transitionFunctions[transitionName] = func.bind(this);
}

Torph.prototype.animatePages = function (fromPageIndex, toPageIndex) {
    if (!this.toPageTransitionDone) {
        alert("Transition is still running");
        return;
    }
    var container = this.container;
    var containerWidth = window.getComputedStyle(container).width;
    var w = parseInt(containerWidth);
    this.containerWidth = w;
    var itemsToReset = [];
    this.toPageTransitionDone = false;
    this.cleanUpAfterToPageDone = [];
    this.tweensToReset = [];
    var self = this;


    if (this.transitionTimeline && this.transitionTimeline.isActive()) {
        this.transitionTimeline.kill()
    }


    var cleanupElementTranisiton = function (data) {
        data.fromElement.style.visibility = "inherit";
        data.toElement.style.visibility = "inherit";
        container.removeChild(data.target);
    }




    var elementAnimations = [];
    var fromPage = document.querySelector(".bd-page[data-index='" + fromPageIndex + "']");
    var toPage = document.querySelector(".bd-page[data-index='" + toPageIndex + "']");



    var onTransitionDone = function () {
        console.log("On Transition Done");
        fromPage.style.visibility = "hidden";
        itemsToReset.forEach(function (item) {
            //TweenMax.set(item, {clearProps:"all"});
        });

        self.toPageTransitionDone = true;
        console.log("All Done");
        for (var i = 0; i < self.cleanUpAfterToPageDone.length; i++) {
            var data = self.cleanUpAfterToPageDone[i];
            console.log("Clean at end");
            cleanupElementTranisiton(data);
        }

        for (var i = 0; i < self.tweensToReset.length; i++) {
            var tween = self.tweensToReset[i];
            // NOTE: Kind of bad cause it prevents inline styles on animated objects as they will be erased after each run.
            // Would be nicer to only clear styles set by the tween...
            //TweenMax.set(tween.target,{clearProps:"all"});

            TweenMax.set(tween.target, {
                clearProps: "opacity,transform"
            });
        }
    }


    this.transitionTimeline = new TimelineMax({
        onComplete: onTransitionDone
    });

    // Page Transition
    var fromIndex = Number(fromPage.getAttribute('data-index'));
    var toIndex = Number(toPage.getAttribute('data-index'));

    var fromPageDelay = fromPage.getAttribute('data-animation-delay') || 0;
    var toPageDelay = fromPage.getAttribute('data-animation-delay') || 0;


    var fromTransitionType = fromPage.getAttribute('data-transition-type') || 'move-left-right';
    var fromTransitionDuration = fromPage.getAttribute('data-transition-duration') || 0.8;
    var toTransitionType = toPage.getAttribute('data-transition-type') || 'move-left-right';
    var toTransitionDuration = toPage.getAttribute('data-transition-duration') || 0.8;

    var fromPageTransitionProperties = this.transitionFunctions[fromTransitionType](fromIndex, toIndex, container);
    var toPageTransitionProperties = this.transitionFunctions[toTransitionType](fromIndex, toIndex, container);

    var toEaseFunc = this.getEasingClass(toPage, 'data-animation-easing');
    if (toEaseFunc) {
        toPageTransitionProperties.toPageEndValues.ease = toEaseFunc;
    }

    var fromEaseFunc = this.getEasingClass(fromPage, 'data-animation-easing');
    if (fromEaseFunc) {
        fromPageTransitionProperties.fromPageEndValues.ease = fromEaseFunc;
    }

    if (toTransitionDuration === 0 || toTransitionDuration === "0") {
        /*
        self.toPageTransitionDone = true;
        console.log("All Done");
        for(var i=0;i<self.cleanUpAfterToPageDone.length;i++) {
            var data = self.cleanUpAfterToPageDone[i];
            console.log("Clean at end");
            cleanupElementTranisiton(data);
        }
        */
    } else {
        /*
        toPageTransitionProperties.toPageEndValues.onComplete = function () {
            self.toPageTransitionDone = true;
            console.log("All Done");
            for(var i=0;i<self.cleanUpAfterToPageDone.length;i++) {
                var data = self.cleanUpAfterToPageDone[i];
                console.log("Clean at end");
                cleanupElementTranisiton(data);
            }
        }
        */
    }



    console.log("Props", toPageTransitionProperties);

    console.log(toTransitionDuration + "   " + fromTransitionDuration);



    if (toTransitionDuration === 0 || toTransitionDuration === "0") {
        TweenMax.set(toPage, toPageTransitionProperties.toPageEndValues);
    } else {
        this.transitionTimeline.fromTo(toPage, toTransitionDuration, toPageTransitionProperties.toPageStartValues, toPageTransitionProperties.toPageEndValues, toPageDelay);

    }

    if (fromTransitionDuration === 0 || fromTransitionDuration === "0") {
        //TweenMax.set(fromPage, fromPageTransitionProperties.fromPageEndValues)
    } else {
        this.transitionTimeline.fromTo(fromPage, fromTransitionDuration, fromPageTransitionProperties.fromPageStartValues, fromPageTransitionProperties.fromPageEndValues, fromPageDelay);

    }




    // Individual Element transitions (fadeIn/fadeOut... no element to element trasitions)
    var outAnimations = fromPage.querySelectorAll('*[data-animation-out]');
    forEach(outAnimations, function (index, value) {
        itemsToReset.push(value);
        var type = value.getAttribute('data-animation-out');
        var delay = value.getAttribute('data-animation-out-delay') || 0;
        
        if (type === "fadeOut") {
            var tween = self.transitionTimeline.fromTo(value, 0.8, {
                opacity: 1
            }, {
                opacity: 0
            }, 0);
            tween.target = value;
            self.tweensToReset.push(tween);
        } else if (type ==="moveUp") {
            var tween = self.transitionTimeline.fromTo(value, 0.3, {
                yPercent: 0,
                opacity: 1
            }, 
            {
                yPercent: -100,
                opacity: 1
            }, delay);
            console.log("MOVE TWEEN ", tween);
            tween.target = value;
            self.tweensToReset.push(tween);
        }
    });

    var inAnimations = toPage.querySelectorAll('*[data-animation-in]');
    forEach(inAnimations, function (index, value) {
        itemsToReset.push(value);
        var type = value.getAttribute('data-animation-in');
        var delay = value.getAttribute('data-animation-in-delay') || 0;

        if (type === "fadeIn") {
            var tween = self.transitionTimeline.fromTo(value, 0.8, {
                opacity: 0
            }, {
                opacity: 1
            }, delay);
            tween.target = value;
            self.tweensToReset.push(tween);
        } else if(type === "moveDown") {
            var tween = self.transitionTimeline.fromTo(value, 0.3, {
                yPercent: -100,
                opacity: 1
            }, 
            {
                yPercent: 0,
                opacity: 1
            }, delay);
            console.log("MOVE TWEEN ", tween);
            tween.target = value;
            self.tweensToReset.push(tween);
        }
        
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
            elementAnimations.push({
                fromElement: elementsFromAnimationIds[val],
                toElement: elementsToPage[i]
            });
        }
    }


    /*
    var staggerGroups = {};
    var staggerElements = toPage.querySelectorAll('*[data-animation-stagger-group]');
    forEach(staggerElements, function (index, element) {
        var groupName = element.getAttribute('data-animation-stagger-group');
        if(!staggerGroups[groupName]) {
            staggerGroups[groupName] = [];
        }
        
        var canBeStaggered = true;
        for(var i=0;i<elementAnimations.length;i++){
            var el = elementAnimations[i];
            if (el.fromElement === element || el.toElement === element) {
                 canBeStaggered = false;  
            }
        }
        
        if (canBeStaggered) {
            staggerGroups[groupName].push(element);
        }
    });
    
    for(var i in staggerGroups) {
        //self.transitionTimeline.staggerFrom(staggerGroups[i], 2, {scale:0.5, opacity:0, delay:0.0, ease:Elastic.easeOut, force3D:true}, 0.2, 0);   
        //self.transitionTimeline.staggerFrom(staggerGroups[i], 2, {y:500, opacity:0, delay:0.0, ease:Elastic.easeOut, force3D:true}, 0.2, 0);   
        self.transitionTimeline.staggerFrom(staggerGroups[i], 2, {yPercent:30, opacity:0, delay:0.0, ease:Elastic.easeOut, force3D:true}, 0.2, 0); 
         
    }
    
    */


    var staggerGroups = {};
    var staggerElements = fromPage.querySelectorAll('*[data-animation-stagger-group]');
    forEach(staggerElements, function (index, element) {
        var groupName = element.getAttribute('data-animation-stagger-group');
        if (!staggerGroups[groupName]) {
            staggerGroups[groupName] = [];
        }

        var canBeStaggered = true;
        for (var i = 0; i < elementAnimations.length; i++) {
            var el = elementAnimations[i];
            if (el.fromElement === element || el.toElement === element) {
                canBeStaggered = false;
            }
        }

        if (canBeStaggered) {
            staggerGroups[groupName].push(element);
        }
    });

    function onStaggerComplete(tween) {
        //alert("On Stagger Complete");
        //tween.target.style.opacity = 1;
        //console.log(tween);
        //tween.pause(0, true); //Go back to the start (true is to suppress events)
        //tween.remove();
        // TweenMax.set(tween.target,{clearProps:tween.vars.css});
        self.tweensToReset.push(tween);
    }

    for (var i in staggerGroups) {
        //self.transitionTimeline.staggerFrom(staggerGroups[i], 2, {scale:0.5, opacity:0, delay:0.0, ease:Elastic.easeOut, force3D:true}, 0.2, 0);   
        //self.transitionTimeline.staggerFrom(staggerGroups[i], 2, {y:500, opacity:0, delay:0.0, ease:Elastic.easeOut, force3D:true}, 0.2, 0);   
        self.transitionTimeline.staggerTo(staggerGroups[i], 2, {
            yPercent: 30,
            opacity: 0,
            delay: 0.0,
            ease: Elastic.easeOut,
            force3D: true,
            onComplete: onStaggerComplete,
            onCompleteParams: ["{self}"]
        }, 0.2, 0);

    }


    console.log("Set To Page Visible");
    toPage.style.visibility = "visible";


    for (var i = 0; i < elementAnimations.length; i++) {
        this.morph(elementAnimations[i].fromElement, elementAnimations[i].toElement);
    }

    //this.transitionTimeline.pause();


    console.log("Elements to animate ", elementAnimations);
}


Torph.prototype.getEasingClass = function (el, attr) {
    // This seems like a very stupid way to do window['Back']['easeOut']
    var classPath;
    if (el.hasAttribute(attr)) {
        var arr = el.getAttribute(attr).split('.');
        classPath = window;
        arr.forEach(function (part) {
            classPath = classPath[part];
        });
    }
    return classPath;

}

Torph.prototype.morph = function (fromNode, toNode) {
    var self = this;
    var container = this.container;
    var stylesToApplyToTarget = fromNode.getAttribute('data-animation-copy-style');
    if (stylesToApplyToTarget) {
        var bgSize = fromNode.style['background-size'];
        //toNode.style[stylesToApplyToTarget] = fromNode.style[stylesToApplyToTarget];
        //toNode.style['background-size'] = bgSize;
    }

    var fromClone = fromNode.cloneNode(true);
    var toClone = toNode.cloneNode(true);

    //copyComputedStyle(fromNode, targetClone);
    //copyComputedStyle(toNode, toClone);

    var toComputedStyles = window.getComputedStyle(toNode);
    var fromComputedStyles = window.getComputedStyle(fromNode);

    console.log("Computed Border ", fromComputedStyles["border-radius"]);
    // Set initial position of the clone

    fromClone.style.margin = "0";
    fromClone.style.padding = "0";
    fromClone.style.position = "absolute";
    //fromClone.style.width = fromComputedStyles["width"];
    //fromClone.style.height = fromComputedStyles["height"];
    fromClone.style.left = fromNode.offsetLeft + "px";
    fromClone.style.top = fromNode.offsetTop + "px";
    fromClone.style['list-style-type'] = fromComputedStyles["list-style-type"];


    toClone.style.margin = "0";
    toClone.style.padding = "0";
    toClone.style.position = "absolute";
    /*toClone.style.opacity = 0;*/
    //toClone.style.width = fromComputedStyles["width"];
    //toClone.style.height = fromComputedStyles["height"];
    toClone.style.left = toNode.offsetLeft + "px";
    toClone.style.top = toNode.offsetTop + "px";
    toClone.style['list-style-type'] = toComputedStyles["list-style-type"];
    //toClone.style["border-radius"] = fromComputedStyles["border-radius"];




    //fromClone.style['background-size'] = animationTargets.fromElement.style['background-size'];

    fromNode.style.visibility = "hidden";
    toNode.style.visibility = "hidden";

    container.appendChild(toClone);
    container.appendChild(fromClone);


    //toPage.style.visibility = "visible"; 



    var cleanupElementTranisiton = function (data) {
        data.fromElement.style.visibility = "inherit";
        data.toElement.style.visibility = "inherit";
        container.removeChild(data.target);
    }


    var onComplete = function (target, fromElement, toElement) {
        console.log("Item animation complete");
        var data = {
            fromElement: fromElement,
            toElement: toElement,
            target: target
        };
        if (self.toPageTransitionDone) {
            cleanupElementTranisiton(data);
        } else {
            self.cleanUpAfterToPageDone.push(data);
        }
    };



    var toWidth = parseInt(toComputedStyles["width"]);
    var toHeight = parseInt(toComputedStyles["height"]);

    var fromWidth = parseInt(fromComputedStyles["width"]);
    var fromHeight = parseInt(fromComputedStyles["height"]);


    fromClone.style.transformOrigin = "0% 0%";


    TweenMax.set(toClone, {
        transformOrigin: "0% 0%",
        x: fromNode.offsetLeft - toNode.offsetLeft,
        y: fromNode.offsetTop - toNode.offsetTop,
        scaleX: fromWidth / toWidth,
        scaleY: fromHeight / toHeight,
        'border-radius': fromComputedStyles["border-radius"]
    });

    var properties = {
        x: toNode.offsetLeft - fromNode.offsetLeft,
        y: toNode.offsetTop - fromNode.offsetTop,
        scaleX: toWidth / fromWidth,
        scaleY: toHeight / fromHeight,
        'border-radius': toComputedStyles["border-radius"],

        opacity: 0,
        onComplete: onComplete,
        onCompleteParams: [fromClone, fromNode, toNode]
    }

    console.warn(properties.scaleX + "   " + properties.scaleY);

    var destinationProperties = {
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        'border-radius': toComputedStyles["border-radius"],
        opacity: 1,
        onComplete: onComplete,
        onCompleteParams: [toClone, fromNode, toNode]
    }


    var easeFunc = this.getEasingClass(fromNode, 'data-animation-easing');
    if (easeFunc) {
        properties.ease = easeFunc;
        destinationProperties.ease = easeFunc;
    }

    var delay = fromNode.getAttribute('data-animation-delay') || 0;
    console.warn("Delay " + delay);
    self.transitionTimeline.to(toClone, 0.8, destinationProperties, 0);
    self.transitionTimeline.to(fromClone, 0.8, properties, 0);


}