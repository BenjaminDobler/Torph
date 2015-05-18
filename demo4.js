var torph1 = new Torph(document.querySelector('.bd-page-container'));





document.querySelector('#zoomSource').addEventListener('click', function () {
    torph1.animatePages(0,1);

});




document.querySelector('#zoomSource1').addEventListener('click', function () {
    torph1.animatePages(0,2);

});


document.querySelector('#zoomSource2').addEventListener('click', function () {
    torph1.animatePages(0,3);

});


document.querySelector('#zoomSource3').addEventListener('click', function () {
    torph1.animatePages(0,4);

});


document.querySelector('#zoomTarget').addEventListener('click', function () {
    torph1.animatePages(1,0);

});


document.querySelector('#zoomTarget1').addEventListener('click', function () {
    torph1.animatePages(2,0);

});

document.querySelector('#zoomTarget2').addEventListener('click', function () {
    torph1.animatePages(3,0);

});

document.querySelector('#zoomTarget3').addEventListener('click', function () {
    torph1.animatePages(4,0);

});





