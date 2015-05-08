




var torph1 = new Torph(document.querySelector('.bd-page-container'));


function forward() {
    torph1.animatePages(0,1);
}

function backward() {
    torph1.animatePages(1,0);
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
        document.querySelector('.top-bg').style.background = evt.currentTarget.style.background;
        forward();
    });
});







