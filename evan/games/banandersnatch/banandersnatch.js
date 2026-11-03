var spot = 0;
var playerName;
var response = "";
var firstTime = true;
var hasBanana = false;

function update() {
    if (document.getElementById("response").value.toUpperCase().localeCompare("")) {
        if (playerName == null) {
            if (!document.getElementById("response").value.toUpperCase().localeCompare("APE")) {
                playerName = "Marc";
            } else if (!document.getElementById("response").value.toUpperCase().localeCompare("GIVE MIKE AN INTERNSHIP")) {
                console.log("correct");
                kingEnding();
                return;
            } else {
                playerName = document.getElementById("response").value;
            }
            document.getElementById("mainTitleLabel").innerText = ("Banandersnatch - " + playerName);
            document.getElementById("response").value = "";
            spot++;
            firstEvent();
        } else {
            response = document.getElementById("response").value;
            document.getElementById("response").value = "";
        }
        console.log(response)
        if (spot == 1 && !firstTime) {
            if (!response.toUpperCase().localeCompare("RUN")) {
                gameOver("You try and outrun the creature, but you make too much noise and alert the creature who chases you down and captures you.");
            } else if (!response.toUpperCase().localeCompare("TURN AROUND")) {
                spot += 1;
                secondEvent();
            } else if (!response.toUpperCase().localeCompare("CLIMB TREE")) {
                spot += 100;
                secondEventAlt();
            } else {
                document.getElementById("response").value = "Please enter a valid input";
            }
        } else if (spot == 2) {
            if (!response.localeCompare("RUN")) {
                gameOver("You try and outrun the creature, but you the APE chases you down and captures you.");
            } else if (!response.toUpperCase().localeCompare("FIGHT")) {
                spot += 1;
                thirdEvent();
            } else {
                document.getElementById("response").value = "Please enter a valid input";
            }
        } else if (spot == 101) {
            if (!response.toUpperCase().localeCompare("TAKE BANANA")) {
                spot = 123123;
                getBanana();
            } else if (!response.toUpperCase().localeCompare("STAY QUIET")) {
                spot += 1;
                thirdEventAlt();
            } else {
                document.getElementById("response").value = "Please enter a valid input";
            }
        } else if (spot == 3) {
            if (!response.toUpperCase().localeCompare("FOLLOW")) {
                spot = 50;
                secondHalfIntro();
            } else if (!response.toUpperCase().localeCompare("DON'T FOLLOW")) {
                spot++;
                thirdEventSneak();
            } else {
                document.getElementById("response").value = "Please enter a valid input";
            }
        } else if (spot == 4) {
            var num = parseInt(response);
            var answer = Math.floor((Math.random() * 10) + 1);
            if (num == answer) {
                escapeEnding();
            } else {
                gameOver("The APE's keen hearing detects your escape and is offended, he hunts you down and captures you");
            }
        } else if (spot == 123123) {
            if (!response.toUpperCase().localeCompare("CONTINUE")) {
                spot = 102;
                thirdEventAlt();
            } else {
                document.getElementById("response").value = "Please enter a valid input";
            }
        } else if (spot == 102) {
            if (!response.toUpperCase().localeCompare("RUN")) {
                gameOver("You try and outrun the creature, but you the APE chases you down and captures you.");
            } else if (!response.toUpperCase().localeCompare("FIGHT")) {
                spot = 3;
                thirdEvent();
            } else {
                document.getElementById("response").value = "Please enter a valid input";
            }
        } else if (spot == 50) {
            if (!response.toUpperCase().localeCompare("LEFT")) {
                spot += 1;
                lookLeft();
            } else if (!response.toUpperCase().localeCompare("RIGHT")) {
                spot += 2;
                lookRight();
            } else {
                document.getElementById("response").value = "Please enter a valid input";
            }
        } else if (spot == 51 || spot == 52) {
            if (!response.toUpperCase().localeCompare("CONTINUE")) {
                spot = 53;
                meetKing();
            } else {
                document.getElementById("response").value = "Please enter a valid input";
            }
        } else if (spot == 53) {
            if (!response.toUpperCase().localeCompare("BOW")) {
                spot = 54;
                fightChampionApe();
            } else if (!response.toUpperCase().localeCompare("TRY TO COMMUNICATE")) {
                gameOver("You make APE noise in an attempt to communicate, but the king speaks perfect english and is greatly offended, you're sentenced to life in prison");
            } else {
                document.getElementById("response").value = "Please enter a valid input";
            }
        } else if (spot == 54) {
            if (!response.toUpperCase().localeCompare("CONTINUE")) {
                spot = 55;
                actualFight();
            } else {
                document.getElementById("response").value = "Please enter a valid input";
            }
        } else if (spot == 55) {
            if (!response.toUpperCase().localeCompare("ROCK")) {
                gameOver("The ape chose paper, for failing the challenge you are sentenced to life in prison");
            } else if (!response.toUpperCase().localeCompare("PAPER")) {
                spot = 56;
                winFight();
            } else if (!response.toUpperCase().localeCompare("SCISSORS")) {
                gameOver("The ape chose rock, for failing the challenge you are sentenced to life in prison");
            } else {
                document.getElementById("response").value = "Please enter a valid input";
            }
        } else if (spot == 56) {
            if (!response.toUpperCase().localeCompare("CONTINUE")) {
                spot = 57;
                kingOffer();
            } else {
                document.getElementById("response").value = "Please enter a valid input";
            }
        } else if (spot == 57) {
            if (!response.toUpperCase().localeCompare("ACCEPT")) {
                championEnding();
            } else if (!response.toUpperCase().localeCompare("CHALLENGE KING APE")) {
                spot = 58;
                challengeKing();
            } else if (!response.toUpperCase().localeCompare("DECLINE")) {
                gameOver("The King APE is offended by your refusal, you have been sentenced to life in prison");
            } else {
                document.getElementById("response").value = "Please enter a valid input";
            }
        } else if (spot == 58) {
            if (!response.toUpperCase().localeCompare("ROCK")) {
                gameOver("The King APE chose paper, you are sentenced to life in prison");
            } else if (!response.toUpperCase().localeCompare("PAPER")) {
                gameOver("The King APE chose scissors, you are sentenced to life in prison");
            } else if (!response.toUpperCase().localeCompare("SCISSORS")) {
                gameOver("The King APE chose rock, you are sentenced to life in prison");
            } else if (!response.toUpperCase().localeCompare("BANANA") && hasBanana) {
                spot = 1000;
                beatKing();
            } else {
                document.getElementById("response").value = "Please enter a valid input";
            }
        } else if (spot == 1000) {
            if (!response.toUpperCase().localeCompare("CONTINUE")) {
                kingEnding();
            } else {
                responseField.setText("Please enter a valid input");
            }
        } else if (firstTime) {
            firstTime = false;
        }
    } else {
        document.getElementById("response").value = "Please enter a valid input";
    }
}

function firstEvent() {
        document.getElementById("image").src="img/jungle.jpg";
        document.getElementById("prompt").innerText = "You're alone on an expedition in the Amazon Jungle and you hear a rustle behind you";
        document.getElementById("prompt2").innerText = "What do you do? (run, turn around, climb tree)";
}

function secondEvent() {
        document.getElementById("image").src="img/stare.jpg";
        document.getElementById("prompt").innerText = "You turn around and see an enourmous APE staring down at you";
        document.getElementById("prompt2").innerText = "What do you do? (run, fight)";
}

function secondEventAlt() {
        document.getElementById("image").src="img/tree.jpg";
        document.getElementById("prompt").innerText = "You climb the tree, you see a massive ape below. There are also bananas in your tree";
        document.getElementById("prompt2").innerText = "What do you do? (take banana, stay quiet)";
}

function thirdEvent() {
        document.getElementById("image").src="img/respect.jpg";
        document.getElementById("prompt").innerText = "The APE respects your fighting spirit and motions for you to follow";
        document.getElementById("prompt2").innerText = "What do you do? (follow, don't follow)";
}

function getBanana() {
        hasBanana = true;
        document.getElementById("image").src="img/banana.png";
        document.getElementById("prompt").innerText = "You now have a banana";
        document.getElementById("prompt2").innerText = "Type 'continue' to continue";
}

function thirdEventAlt() {
        document.getElementById("image").src="img/stare.jpg";
        document.getElementById("prompt").innerText = "You climb down once you think it's safe, but turn to see an enourmous APE staring";
        document.getElementById("prompt2").innerText = "down at you. What do you do? (run, fight)";
}

function thirdEventSneak() {
    document.getElementById("prompt").innerText = "You try to sneak away while the APE's not looking";
    document.getElementById("prompt2").innerText = "Pick a number between 1 and 10 [inclusive]";
}


// SECOND HALF OF BANANDERSNATCH

function secondHalfIntro() {
    document.getElementById("image").src="img/banana-farm.jpg";
        document.getElementById("prompt").innerText = "You follow the APE. He brings you to the lost city of APElantis. You take a look";
        document.getElementById("prompt2").innerText = "around. Which way do you look? (left, right)";
}

function lookLeft() {
    document.getElementById("image").src="img/statue.jpg";
        document.getElementById("prompt").innerText = "You look left and see a 50ft gold statue of an ape wearing a crown. Looks like some";
        document.getElementById("prompt2").innerText = "sort of king. Type 'continue' to continue";
}

function lookRight() {
    document.getElementById("image").src="img/crowd.jpg";
        document.getElementById("prompt").innerText = "You look right and see thousands of APEs, marketplaces, and homes. It contains";
        document.getElementById("prompt2").innerText = "technology you can't even fathom. Type 'continue' to continue";
}

function meetKing() {
    document.getElementById("image").src="img/king.jpg";
        document.getElementById("prompt").innerText = "You are brought into a palace of sorts. In it you are met with the King APE";
        document.getElementById("prompt2").innerText = "What do you do? (bow, try to communicate)";
}

function fightChampionApe() {
    document.getElementById("image").src="img/king.jpg";
        document.getElementById("prompt").innerText = "You bow before the King APE, who declares that you must prove yourself by fighting";
        document.getElementById("prompt2").innerText = "the APE Champion. Type 'continue' to continue";
}

function actualFight() {
    document.getElementById("image").src="img/champion.jpg";
        document.getElementById("prompt").innerText = "The Champion APE comes out from the shadows, he is 15ft tall and RIPPED.";
        document.getElementById("prompt2").innerText = "Choose your weapon (rock, paper, scissors)";
}

function winFight() {
    document.getElementById("image").src="img/win.jpg";
        document.getElementById("prompt").innerText = "Your paper beats the Champion APE's rock, you have won!";
        document.getElementById("prompt2").innerText = "Type 'continue' to continue";
}

function kingOffer() {
    document.getElementById("image").src="img/king.jpg";
        document.getElementById("prompt").innerText = "The King APE is impressed and offers to make you the new Champion APE";
        document.getElementById("prompt2").innerText = "What do you do? (accept, decline, challenge King APE)";
}

function challengeKing() {
    document.getElementById("image").src="img/kingfight.jpg";
        document.getElementById("prompt").innerText = "The King APE accepts your challenge";
        document.getElementById("prompt2").innerText = "Choose your weapon (rock, paper, scissors)";
}

function beatKing() {
        document.getElementById("image").src="img/kingfight.jpg";
        document.getElementById("prompt").innerText = "You take out the banana as the King APE throws scissors. All APEs are momentarily";
        document.getElementById("prompt2").innerText = "distracted as you switch your hand to rock, you win! Type 'continue' to continue";
}

function gameOver(message) {
    document.getElementById("submit").disabled = true;
    document.getElementById("image").src="img/gameover.jpg";
    document.getElementById("prompt").innerText = message;
    document.getElementById("prompt2").innerText = "Refresh the page to try again";
}

function escapeEnding() {
    document.getElementById("submit").disabled = true;
    document.getElementById("image").src="img/escape.jpg";
    document.getElementById("prompt").innerText = "ENDING #1";
    document.getElementById("prompt2").innerText = "You successfully escaped the APE, but you feel as if you've missed a great adventure";
}

function championEnding() {
    document.getElementById("submit").disabled = true;
    document.getElementById("image").src="img/newchampion.jpg";
    document.getElementById("prompt").innerText = "ENDING #2";
    document.getElementById("prompt2").innerText = "Congrats you are now the Champion APE!!";
}

function kingEnding() {
    document.getElementById("submit").disabled = true;
    document.getElementById("image").src="img/newking.jpg";
    document.getElementById("prompt").innerText = "ENDING #3";
    document.getElementById("prompt2").innerText = "You have become the King APE. You are now a God among APEs";
}