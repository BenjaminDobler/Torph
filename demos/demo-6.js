var torph1 = new Torph(document.querySelector('.torph-container'));



function forward() {
    torph1.animatePages(0, 1);
}

function backward() {
    torph1.animatePages(1, 0);
}

