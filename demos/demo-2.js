var torph1 = new Torph(document.querySelector('.torph-container'));
var recordTween;
var img = document.querySelector('.album-detail-header img');
torph1.on("onTransitionDone", function (fromIndex, toIndex, fromPage, toPage) {
    if (toIndex === 1) {
        recordTween = TweenMax.fromTo(img, 5, {
            rotation: 0
        }, {
            rotation: 360,
            repeat: -1,
            ease: Linear.easeNone
        });
    }
});



function onPlayheadChange() {
    var val = document.querySelector('#playhead').value / 100;
    torph1.transitionTimeline.progress(val);
}

function onDebugCheckChanged() {
    var checked = document.querySelector('#debug-check').checked;
    torph1.pauseOnTransitionStart = checked;
}



function forward() {
    torph1.animatePages(0, 1);
}

function backward() {
    torph1.animatePages(1, 0);
}



//http://toddmotto.com/ditch-the-array-foreach-call-nodelist-hack/
var forEach = function (array, callback, scope) {
    for (var i = 0; i < array.length; i++) {
        callback.call(scope, i, array[i]); // passes back stuff we need
    }
};


document.querySelector('.album-detail-header').addEventListener('click', function () {
    recordTween.kill();
    var onComplete = function () {
        backward();
    };
    TweenMax.to(img, 0.5, {
        rotation: 0,
        ease: Back.easeOut,
        onComplete: onComplete
    });


});


var albums = document.querySelectorAll('.album-list li');
var albumImages = document.querySelectorAll('.album-list li img');

forEach(albums, function (index, album) {
    album.addEventListener('click', function (evt) {

        forEach(albumImages, function (index, album) {
            album.removeAttribute('data-animation-id');
        });
        var img = evt.currentTarget.querySelector('img');
        img.setAttribute('data-animation-id', 'header-img');
        img.setAttribute('data-animation-easing', 'Back.easeInOut');
        img.setAttribute('data-animation-duration', '1');
        document.querySelector('.album-detail-header img').setAttribute('data-animation-id', 'header-img');

        var src = img.getAttribute('src');
        document.querySelector('.album-detail-header img').setAttribute('src', src);
        forward();


    });
});