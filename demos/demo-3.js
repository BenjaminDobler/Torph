var torph1 = new Torph(document.querySelector('.torph-container'));



var forEach = function (array, callback, scope) {
    for (var i = 0; i < array.length; i++) {
        callback.call(scope, i, array[i]); // passes back stuff we need
    }
};


var albums = document.querySelectorAll('.album-list img');



forEach(albums, function (index, album) {
    album.addEventListener('click', function (evt) {

        forEach(albums, function (index, album) {
            album.removeAttribute('data-animation-id');
        });

        var src = evt.currentTarget.getAttribute('src');
        document.querySelector('.player-image img').setAttribute('src', src);
        evt.currentTarget.setAttribute('data-animation-id', 'shared-image');

        document.querySelector('.player-image').setAttribute('data-animation-id', 'shared-image');
        torph1.animatePages(0, 1);

    });
});


document.querySelector('.player-image').addEventListener('click', function () {
    torph1.animatePages(1, 0);
});