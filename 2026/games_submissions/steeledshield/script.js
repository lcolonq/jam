//Assets & Elements
var bomb = document.getElementById("bomb");
var food = document.getElementById("food");
var blank = document.getElementById("blank");
var friend = document.getElementById("friend");
var container = document.getElementById("container");
const objects = document.querySelectorAll(".objects");
var explode = new Audio('assets/Explode.wav');
var eat = new Audio('assets/Eat.wav');
var win = new Audio('assets/Win.wav');
var music = new Audio('assets/feeding_friend-zy_beat.wav');
music.loop = true;
music.volume = 0.33;

//Score counter
var counter = 0;

//Randomizes food & bombs, as well as food emoji
var random = Math.floor(Math.random() * 3);
var foodItemRand = Math.floor(Math.random() * 3);

//Iterator
let i = 0;

//result & randoStart ensure that food & bomb start on either side of friend,
//this will make it so that a bomb doesn't spawn immediatley oncoming to the player
const result = Math.floor(Math.random() * 2) * 2;

function randoStart(){for (i; i < objects.length; i++) {
    objects[0].style.order = result;
    objects[1].style.order = 1;
    if(result == 0){
        objects[2].style.order = 2;
    }
    else{
        objects[2].style.order = 0;
    }
    food.innerHTML = foodItem[foodItemRand];
    
}};

//Moves the food & bomb
function objectMove(){
    for (let i = 0; i < objects.length; i++) {
        objects[i].style.animation = "slide 1.5s infinite";
    }
}

//Pauses food & bomb scrolling
function objectStop(){
    for (let i = 0; i < objects.length; i++) {
        objects[i].style.animation = "none";
    }
}

//Pauses food & bomb scrolling
objectStop();


//Pauses the game to show instructions
//Once the message has been received from Clonk's harness the game will begin
function clonkload(){
    //for the love of god Steeled, do NOT touch this line of code
    //it is finally working now
    window.parent.postMessage({op: "ready"});
    //this one too, this is a load-bearing eventlistener
    //game will fall apart like a jenga™ structure if this eventlistener is broken
    window.addEventListener("message", ev => {
        window.parent.postMessage({op: "started", verb: "Feed Friend!"}),
        setTimeout(() => {
            objectMove(),
            document.getElementById("counter").innerHTML = "Foods eated: " + counter,
            document.getElementById("counter").style.width = "75px"
        }, 2000)
    });
}

//Food emojis, purely visual, has no gameplay effect
const foodItem = [];
foodItem[0]= "🍌";
foodItem[1]= "🍎";
foodItem[2]= "🍊";

//Loads instructions, randomizes the bomb & food positions and runs the harness check
document.addEventListener("load", 
    randoStart(),
    clonkload(),
    document.getElementById("counter").innerHTML = "Feed Friend! <br> Avoid the Bombs!",
    document.getElementById("counter").style.width = "100%"
);

//Prevents context menu on right click, so that the player can move right without issues
document.addEventListener('contextmenu', (event) => {
    event.preventDefault();
});

function moveLeft(){
    let left = parseInt(window.getComputedStyle(friend)
    .getPropertyValue("left"));
    left -= 32;
    if(left>=0){
        friend.style.left = left + "px";
    };
    music.play();
}

function moveRight(){
    let left = parseInt(window.getComputedStyle(friend)
    .getPropertyValue("left"));
    left += 32;
    if(left<96){
        friend.style.left = left + "px";
    };
    music.play();
}

//Checks mouse input, to get direction of movement
document.addEventListener('mousedown', (event) => {
  switch (event.button) {
    case 0:
      moveLeft();
      break;
    case 2:
      moveRight();
      break;
  }
});

//Moves the food & bomb row back to the top once it reaches the bottom of the game screen
setInterval(function(){for (let i = 0; i < objects.length; i++) {
    objects[i].addEventListener('animationiteration', () => {
        random = Math.floor(Math.random() * 3) + 1;
        foodItemRand = Math.floor(Math.random() * 3);
        objects[i].style.order = random;
        food.innerHTML = foodItem[foodItemRand];
})}},125);

//Underlying collision code to be used for both food & bombs
function isCollide(a, b) {
    var aRect = a.getBoundingClientRect();
    var bRect = b.getBoundingClientRect();

    return !(
        ((aRect.top + aRect.height) < (bRect.top)) ||
        (aRect.top > (bRect.top + bRect.height)) ||
        ((aRect.left + aRect.width) < bRect.left) ||
        (aRect.left > (bRect.left + bRect.width))
    );
}

//Checks collisions on an interval
setInterval(function(){
    //Food collision check
    if(isCollide(friend, food)){
        friend.innerHTML = "<img src='assets/friend_happy.png'>";
        counter++;
        eat.play();
        document.getElementById("counter").innerHTML = "Foods eated: " + counter;
        //Ends game at 10 food eaten
        if(counter>9){
            win.play();
            container.style.visibility = "hidden";
            objectStop();
            document.getElementById("counter").style.width = "100%";
            document.getElementById("counter").innerHTML = "YOU WIN! CONGLATURATIONS!";
            //Tells harness that the game is won and resets, to await the harness check again
            setTimeout(function(){
                window.parent.postMessage({op: "done", win: true}),
                location.reload()
            },2000);
        }
    else{
        //Makes friend a happy fella :) on collision with food
        setTimeout(function(){
            friend.innerHTML = "<img src='assets/friend.png'>";
        },1000);
    }
    }
    //Bomb collsion check
    if(isCollide(friend, bomb)){
        container.style.visibility = "hidden";
        objectStop();
        explode.play();
        document.getElementById("counter").style.width = "100%";
        document.getElementById("counter").innerHTML = "oh no...";
        //Makes friend explode :( on collision with bomb
        friend.innerHTML = "💥";
        setTimeout(function(){
            //Tells harness that the game is lost and resets, to await the harness check again
            window.parent.postMessage({op: "done", win: false}),
            location.reload()
        },2000);
    }
},250);

//Hate. Let me tell you how much I've come to hate Javascript since I began to jam.
//There are 5771 characters contained in the total lines of code that fill my script.js file.
//If the word 'hate' was engraved on each subpixel of those 5771 characters
//it would not equal one one-billionth of the hate I feel for javascript at this micro-instant.
//For js. Hate. Hate. 