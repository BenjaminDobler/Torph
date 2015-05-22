window.Torph = (function () {


    // Micro event taken from here: https://github.com/jeromeetienne/microevent.js
    /**
     * MicroEvent - to make any js object an event emitter (server or browser)
     *
     * - pure javascript - server compatible, browser compatible
     * - dont rely on the browser doms
     * - super simple - you get it immediatly, no mistery, no magic involved
     *
     * - create a MicroEventDebug with goodies to debug
     *   - make it safer to use
     */

    var MicroEvent = function () {};
    MicroEvent.prototype = {
        on: function (event, fct) {
            this._events = this._events || {};
            this._events[event] = this._events[event] || [];
            this._events[event].push(fct);
        },
        off: function (event, fct) {
            this._events = this._events || {};
            if (event in this._events === false) return;
            this._events[event].splice(this._events[event].indexOf(fct), 1);
        },
        trigger: function (event /* , args... */ ) {
            this._events = this._events || {};
            if (event in this._events === false) return;
            for (var i = 0; i < this._events[event].length; i++) {
                this._events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
            }
        }
    };

    /**
     * mixin will delegate all MicroEvent.js function in the destination object
     *
     * - require('MicroEvent').mixin(Foobar) will make Foobar able to use MicroEvent
     *
     * @param {Object} the object which will support MicroEvent
     */
    MicroEvent.mixin = function (destObject) {
        var props = ['on', 'off', 'trigger'];
        for (var i = 0; i < props.length; i++) {
            if (typeof destObject === 'function') {
                destObject.prototype[props[i]] = MicroEvent.prototype[props[i]];
            } else {
                destObject[props[i]] = MicroEvent.prototype[props[i]];
            }
        }
    }


    var forEach = function (array, callback, scope) {
        for (var i = 0; i < array.length; i++) {
            callback.call(scope, i, array[i]); // passes back stuff we need
        }
    };


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
        //dest.style.cssText = document.defaultView.getComputedStyle(src, "").cssText;
        //return;
        var s = realStyle(src);
        //var unsortedStyles = [];
        var prefixedStyles = [];
        var unprefixedStyle = [];

        for (var i in s) {
            // Do not use `hasOwnProperty`, nothing will get copied
            if (typeof i == "string" && i != "cssText" && !/\d/.test(i)) {
                // The try is for setter only properties
                try {

                    //if (i.indexOf('webkit') == -1) {
                    //console.log(i+"   "+s[i])
                    if (i.toLowerCase().indexOf('webkit') === 0) {
                        prefixedStyles.push({
                            name: i,
                            value: s[i]
                        });
                    } else {
                        unprefixedStyle.push({
                            name: i,
                            value: s[i]
                        });
                    }
                    dest.style[i] = "";
                    //unsortedStyles.push({name:i, value: s[i]});
                    /*    
                    dest.style[i] = s[i];
                        // `fontSize` comes before `font` If `font` is empty, `fontSize` gets
                        // overwritten.  So make sure to reset this property. (hackyhackhack)
                        // Other properties may need similar treatment
                        if (i == "font") {
                            dest.style.fontSize = s.fontSize;
                        }

                    //}
                    */
                } catch (e) {}
            }
        }


        for (var i = 0; i < prefixedStyles.length; i++) {
            var s = prefixedStyles[i];
            //console.log(s.name);
            if (s.name.toLowerCase().indexOf("margin") == -1) {
                dest.style[s.name] = s.value;
            }
        }


        for (var i = 0; i < unprefixedStyle.length; i++) {
            var s = unprefixedStyle[i];
            //console.log(s.name.indexOf("margin"));
            dest.style[s.name] = s.value;
        }





    };


    function getOffsetRect(elem) {
        // (1)
        var box = elem.getBoundingClientRect()

        var body = document.body
        var docElem = document.documentElement

        // (2)
        var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop
        var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft

        // (3)
        var clientTop = docElem.clientTop || body.clientTop || 0
        var clientLeft = docElem.clientLeft || body.clientLeft || 0

        // (4)
        var top = box.top + scrollTop - clientTop
        var left = box.left + scrollLeft - clientLeft

        return {
            top: Math.round(top),
            left: Math.round(left)
        }
    }


    function getBoundingClientRectRelativeTo(element, container) {
        /*
        var top = 0;
        var left = 0;
        
        while(element.parentNode!=container) {
            top+=element.offsetTop;
            left+=element.offsetLeft;
            element = element.parentNode;
        }
        
        return {
            left: left,
            top: top,
            width: element.offsetWidth,
            height: element.offsetHeight
        }
        */

        var elementBox = element.getBoundingClientRect();
        var containerBox = container.getBoundingClientRect();
        return {
            left: elementBox.left - containerBox.left,
            top: elementBox.top - containerBox.top,
            width: elementBox.width,
            height: elementBox.height
        }

    }





    function Torph(container) {
        this.transitionTimeline;
        this.container = container;
        this.toPageTransitionDone = true;
        this.cleanUpAfterToPageDone = [];
        this.containerWidth = 0;
        var self = this;
        this.transitionFunctions = {};
        this.pauseOnTransitionStart = false;

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



        function fadeInOut(fromIndex, toIndex, container) {
            var fromPageStartValues = {
                opacity: 1
            };
            var fromPageEndValues = {
                opacity: 0
            };
            var toPageStartValues = {
                opacity: 0
            };
            var toPageEndValues = {
                opacity: 1
            };


            return {
                fromPageStartValues: fromPageStartValues,
                fromPageEndValues: fromPageEndValues,
                toPageStartValues: toPageStartValues,
                toPageEndValues: toPageEndValues
            }

        }

        this.transitionFunctions['fadeInOut'] = fadeInOut;


    }


    Torph.prototype.registerPageTransition = function (transitionName, func) {
        this.transitionFunctions[transitionName] = func.bind(this);
    }

    Torph.prototype.animatePages = function (fromPageIndex, toPageIndex) {


        if (!this.toPageTransitionDone) {
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
        var fromPage = document.querySelector(".torph-page[data-index='" + fromPageIndex + "']");
        var toPage = document.querySelector(".torph-page[data-index='" + toPageIndex + "']");
        this.fromPage = fromPage;
        this.toPage = toPage;
        this.fromPageBoundingBox = this.fromPage.getBoundingClientRect();
        this.toPageBoundingBox = this.toPage.getBoundingClientRect();

        var fromIndex = Number(fromPage.getAttribute('data-index'));
        var toIndex = Number(toPage.getAttribute('data-index'));



        var onTransitionDone = function () {
            fromPage.style.visibility = "hidden";
            itemsToReset.forEach(function (item) {
                //TweenMax.set(item, {clearProps:"all"});
            });

            self.toPageTransitionDone = true;
            for (var i = 0; i < self.cleanUpAfterToPageDone.length; i++) {
                var data = self.cleanUpAfterToPageDone[i];
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

            self.trigger("onTransitionDone", fromIndex, toIndex, self.fromPage, self.toPage);
        }


        this.transitionTimeline = new TimelineMax({
            onComplete: onTransitionDone
        });

        // Page Transition

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
            } else if (type === "moveUp") {
                var tween = self.transitionTimeline.fromTo(value, 0.3, {
                    yPercent: 0,
                    opacity: 1
                }, {
                    yPercent: -100,
                    opacity: 1
                }, delay);
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
                var tween = self.transitionTimeline.fromTo(value, 0.3, {
                    opacity: 0
                }, {
                    opacity: 1
                }, delay);
                tween.target = value;
                self.tweensToReset.push(tween);
            } else if (type === "moveDown") {
                var tween = self.transitionTimeline.fromTo(value, delay, {
                    yPercent: -100,
                    opacity: 1
                }, {
                    yPercent: 0,
                    opacity: 1
                }, delay);
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



        var zoomSources = fromPage.querySelectorAll('*[data-zoom-target]');
        forEach(zoomSources, function (index, element) {
            var zoomTargetId = element.getAttribute('data-zoom-target');
            var zoomTarget = toPage.querySelector('#' + zoomTargetId);
            if (zoomTarget) {
                self.zoomFromTo(element, zoomTarget);
            }
        });



        toPage.style.visibility = "visible";


        for (var i = 0; i < elementAnimations.length; i++) {
            this.morph(elementAnimations[i].fromElement, elementAnimations[i].toElement);
        }


        var fromStaggerGroups = fromPage.querySelectorAll('staggergroup');
        var toStaggerGroups = toPage.querySelectorAll('staggergroup');

        for (var i = 0; i < fromStaggerGroups.length; i++) {
            this.animateStaggerGroup(fromPage, fromStaggerGroups[i], "out");
        }

        for (var i = 0; i < toStaggerGroups.length; i++) {
            this.animateStaggerGroup(toPage, toStaggerGroups[i], "in");
        }

    }


    Torph.prototype.animateStaggerGroup = function (page, group, type) {
        var self = this;
        var groupName = group.getAttribute('data-animation-name');
        var elements = page.querySelectorAll('[data-animation-stagger-group="albums"]');
        var filteredElements = [];
        for (var i = 0; i < elements.length; i++) {
            var element = elements[i];
            if (!element.hasAttribute('data-animation-id')) {
                filteredElements.push(element);
            }
        }
        elements = filteredElements;
        var delay = 0.4;
        var delayStep = 0.4 / elements.length;

        function onStaggerComplete(tween) {
            self.tweensToReset.push(tween);
        }

        if (!type || type === "out") {
            for (var y = 0; y < elements.length; y++) {
                var element = elements[y];
                delay = 0.4 - (y * delayStep);
                this.transitionTimeline.to(element, 0.6, {
                    yPercent: 600,
                    scale: 0.8,
                    opacity: 0,
                    ease: Sine.easeOut,
                    force3D: true,
                    onComplete: onStaggerComplete,
                    onCompleteParams: ["{self}"]
                }, delay);
            }
        } else {
            var delay = 0;
            var delayStep = 0.4 / elements.length;
            for (var y = 0; y < elements.length; y++) {
                var element = elements[y];
                self.transitionTimeline.from(element, 0.6, {
                    yPercent: 600,
                    scale: 0.8,
                    opacity: 0,
                    ease: Sine.easeOut,
                    force3D: true,
                    onComplete: onStaggerComplete,
                    onCompleteParams: ["{self}"]
                }, delay);
                delay = y * delayStep;

            }


        }

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


    Torph.prototype.zoomFromTo = function (fromNode, toNode) {
        var self = this;
        var fromClone = fromNode.cloneNode(true);
        var toClone = toNode.cloneNode(true);

        copyComputedStyle(fromNode, fromClone);
        copyComputedStyle(toNode, toClone);
        var boundingBox = getBoundingClientRectRelativeTo(fromNode, this.fromPage); //fromNode.getBoundingClientRect();

        fromClone.style.margin = "0";
        fromClone.style.padding = "0";
        fromClone.style.position = "absolute";
        fromClone.style.left = boundingBox.left + "px";
        fromClone.style.top = boundingBox.top + "px";

        fromNode.style.visibility = "hidden";
        toNode.style.visibility = "hidden";
        fromClone.style["-webkit-transformOrigin"] = "0% 0%";
        fromClone.style.transformOrigin = "0% 0%";
        this.container.appendChild(fromClone);


        var leftIn = boundingBox.width * 0.2;
        var topIn = boundingBox.height * 0.2;

        var destinationBoundingBox = toNode.getBoundingClientRect();
        var destinationProperties = {
            scaleX: 0.8,
            scaleY: 0.8,
            x: leftIn / 2,
            y: topIn / 2
        }

        var onComplete = function (target, fromElement, toElement) {
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

        var xRatio = destinationBoundingBox.width / boundingBox.width;
        var yRatio = destinationBoundingBox.height / boundingBox.height;
        var finalProperties = {
            scaleX: destinationBoundingBox.width / (boundingBox.width),
            scaleY: destinationBoundingBox.height / (boundingBox.height),
            x: (destinationBoundingBox.left - this.toPage.getBoundingClientRect().left) - boundingBox.left,
            y: (destinationBoundingBox.top - this.toPage.getBoundingClientRect().top) - boundingBox.top,
            onComplete: onComplete,
            onCompleteParams: [fromClone, fromNode, toNode]
        }
        this.transitionTimeline.to(fromClone, 0.2, destinationProperties, 0);
        this.transitionTimeline.to(fromClone, 0.8, finalProperties, 0.3);

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

        copyComputedStyle(fromNode, fromClone);
        copyComputedStyle(toNode, toClone);

        var toComputedStyles = window.getComputedStyle(toNode);
        var fromComputedStyles = window.getComputedStyle(fromNode);

        // Set initial position of the clone

        var fromNodeBoundingBox = getBoundingClientRectRelativeTo(fromNode, this.fromPage);
        var toNodeBoundingBox = getBoundingClientRectRelativeTo(toNode, this.toPage);

        console.log(fromNodeBoundingBox.left + "    " + toNodeBoundingBox.left);

        fromClone.style.margin = "0";
        fromClone.style.padding = "0";
        fromClone.style.position = "absolute";
        //fromClone.style.width = fromComputedStyles["width"];
        //fromClone.style.height = fromComputedStyles["height"];
        fromClone.style.left = fromNodeBoundingBox.left + "px";
        fromClone.style.top = fromNodeBoundingBox.top + "px";
        //fromClone.style['list-style-type'] = fromComputedStyles["list-style-type"];


        toClone.style.margin = "0";
        toClone.style.padding = "0";
        toClone.style.position = "absolute";
        /*toClone.style.opacity = 0;*/
        //toClone.style.width = fromComputedStyles["width"];
        //toClone.style.height = fromComputedStyles["height"];
        toClone.style.left = toNodeBoundingBox.left + "px";
        toClone.style.top = toNodeBoundingBox.top + "px";
        //toClone.style['list-style-type'] = toComputedStyles["list-style-type"];
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


        fromClone.style["-webkit-transformOrigin"] = "0% 0%";
        fromClone.style.transformOrigin = "0% 0%";

        // Because the source object is scaled we also need to scale the radius!
        var targetRadius = parseInt(toComputedStyles["border-radius"]);
        var destinationRadius = targetRadius * (fromWidth / toWidth);



        var targetRadius2 = parseInt(fromComputedStyles["border-radius"]);
        var destinationRadius2 = targetRadius2 * (toWidth / fromWidth);


        //alert(destinationRadius);

        TweenMax.set(toClone, {
            transformOrigin: "0% 0%",
            x: fromNodeBoundingBox.left - toNodeBoundingBox.left,
            y: fromNodeBoundingBox.top - toNodeBoundingBox.top,
            scaleX: fromWidth / toWidth,
            scaleY: fromHeight / toHeight,
            'border-radius': destinationRadius2 + "px" //fromComputedStyles["border-radius"]
        });

        console.log("X " + Number(toNodeBoundingBox.top - fromNodeBoundingBox.top));
        var properties = {
            x: toNodeBoundingBox.left - fromNodeBoundingBox.left,
            y: toNodeBoundingBox.top - fromNodeBoundingBox.top,
            scaleX: toWidth / fromWidth,
            scaleY: toHeight / fromHeight,
            borderRadius: destinationRadius + "px", //toComputedStyles["border-radius"],

            opacity: 0,
            onComplete: onComplete,
            onCompleteParams: [fromClone, fromNode, toNode]
        }


        console.log("To Styles", toComputedStyles);
        var toBorderRadius = toComputedStyles["border-radius"];
        var borderLeft = toComputedStyles["border-bottom-left-radius"];
        console.log("Border Radius " + toBorderRadius + "   " + borderLeft);

        var destinationProperties = {
            x: 0,
            y: 0,
            scaleX: 1,
            scaleY: 1,
            borderRadius: toComputedStyles["border-radius"],
            opacity: 1,
            onComplete: onComplete,
            onCompleteParams: [toClone, fromNode, toNode]
        }


        var easeFunc = this.getEasingClass(fromNode, 'data-animation-easing');
        if (easeFunc) {
            properties.ease = easeFunc;
            destinationProperties.ease = easeFunc;
        }

        var duration = fromNode.getAttribute('data-animation-duration') || 0.5;

        var delay = fromNode.getAttribute('data-animation-delay') || 0;
        self.transitionTimeline.to(toClone, duration, destinationProperties, delay);
        self.transitionTimeline.to(fromClone, duration, properties, delay);
        if (this.pauseOnTransitionStart) {
            self.transitionTimeline.pause();
        }

    }

    MicroEvent.mixin(Torph);

    return Torph;
}());