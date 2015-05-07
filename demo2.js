




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


document.querySelector('.album-detail-header').addEventListener('click', function () {
    backward();
});


var albums = document.querySelectorAll('.album-list li');
var albumImages = document.querySelectorAll('.album-list li img');
var albumTitles = document.querySelectorAll('.album-list li span');

forEach(albums, function (index, album) {
    console.log(album);
    album.addEventListener('click', function (evt) {
        
        forEach(albumImages, function (index, album) {
            album.removeAttribute('data-animation-id');
        });
        
        
        forEach(albumTitles, function (index, album) {
            album.removeAttribute('data-animation-id');
        });
        
        evt.currentTarget.querySelector('img').setAttribute('data-animation-id','header-img');
        evt.currentTarget.querySelector('span').setAttribute('data-animation-id','header-title');
        
        document.querySelector('.album-detail-header img').setAttribute('data-animation-id','header-img');
        document.querySelector('.album-detail-header span').setAttribute('data-animation-id','header-title');
        
        
        //evt.currentTarget.querySelector('span').setAttribute('data-animation-id','header-txt');
        //document.querySelector('.album-detail-header span').setAttribute('data-animation-id','header-txt');
        
        
        var src = evt.currentTarget.querySelector('img').getAttribute('src');
        document.querySelector('.album-detail-header img').setAttribute('src',src);
        //evt.currentTarget.setAttribute('data-animation-id','user-image');
        
        forward();
        
        
    });
});







