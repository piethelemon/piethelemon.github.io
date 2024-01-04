// Get config from import params
const url = new URL(import.meta.url);
const config = {
  maxEmotes: Number(url.searchParams.get('maxEmotes')) || 20 // default to 20
}

// const files_position = "files/";

const amen_std = new Audio(window.config.files_position + "amen.mp3");
// const amen_std_volume = 0.2;

let pray_active = false;
let counter = 0; // Amen counter
// const emote_limit = 1; // Number of amen skipped before dropping an emote

// const std_amen_chance = 0.6; // Value of the probability that the standard amen plays against a random one, from 0 to 1
// const std_amen_random_reduction_volume = 0.0;

const amen_list_file = await fetch("sfx_utenti.json");
const amen_list = await amen_list_file.json()
const amen_users = await Object.keys(amen_list);
// console.log(amen_list);
// console.log(amen_users);

// Streamer.bot WebSocket Client configuration
import "https://cdn.skypack.dev/@streamerbot/client";
const client = new StreamerbotClient({
  host: window.config.host || '127.0.0.1',
  port: window.config.port || 8080,
  endpoint: window.config.endpoint || '/',
});

await client.on('Twitch.ChatMessage', (message) => {
  // console.log(message);
  let sender = message.data.message.userId.toString(message.data.message.userId);
  let text = message.data.message.message;
  // console.log(amen_users);
  // console.log(sender);
  // console.log("User included: ", amen_users.includes(sender));

  // First case: checks for the !testamen #TWITCHID #VOLUME command (volume must be a number)
  if (text.toLowerCase().substring(0,9) === '!testamen' && message.data.message.role > 3) {// role > 3 --> Moderator or Broadcaster
    console.log("recognized the testamen command");
    let index_id = text.indexOf(' ');
    let index_volume = text.lastIndexOf(' ');
    let id = text.substring(index_id+1,index_volume);
    let volume = Number.parseFloat(text.substring(index_volume+1));
    console.log("ID that will be played:", id);
    console.log("Volume at which will be played:", volume);
    playSFX(id, volume);
  } 
  else if (text.toLowerCase().includes("amen") && pray_active) {
    setTimeout(() =>  {
      if (amen_users.includes(sender)) {
        let sfx = new Audio(window.config.files_position + amen_list[sender].filename);
        sfx.volume = amen_list[sender].volume;
        sfx.play();
      }
      else {
        if (Math.random() < window.config.std_amen_chance) {
          let sfx = amen_std.cloneNode(true);
          sfx.volume = window.config.amen_std_volume;
          sfx.play();
        }
        else {
          let id = amen_users[Math.round(Math.random()*(amen_users.length-1))];
          let sfx = new Audio(window.config.files_position + amen_list[id].filename);
          sfx.volume = amen_list[id].volume - window.config.std_amen_random_reduction_volume;
          sfx.play();
        }
      }
      if (!(counter % window.config.emote_limit)) {
        emoteRain('https://static-cdn.jtvnw.net/emoticons/v2/302548261/default/dark/1.0');
      }
      counter++;
    }, 300);
  }

  // // PieTheLemon ID: 68866589
  // if (message.data.message.userId == 88803358) { // LupoMarcio ID: 88803358
  //   if (text === "Amen, Allupati!!") {
  //     pray_active = true;
  //     counter = 0;
  //     console.log(pray_active);
  //   }
  // }

  // if (message.data.message.userId == 173663394) { // FesterBot ID: 173663394
  //   if (text === "Bonkate in pace!") {
  //     pray_active = false;
  //     counter = 0;
  //     console.log(pray_active);
  //   }
  // }
});

await client.on('Raw.Action', (message) => {
  if (message.data.actionId === '0bfa6903-066a-4d30-aed4-85dc2d4eebf9' && (pray_active == false)){
    pray_active = true;
    counter = 0;
    console.log("Pray status:", pray_active);
  }
  else if (message.data.actionId === '7e5c215e-96a5-41df-a14a-b126bb8ec7a5' && (pray_active == true)) {
    pray_active = false;
    counter = 0;
    console.log("Pray status:", pray_active);
  }
});

// GSAP deps
import { Linear, Sine, TweenLite, TweenMax } from 'https://cdn.skypack.dev/gsap/all';

// Create our confetti container and append to document body
const confettiContainer = document.createElement("div");
confettiContainer.id = 'confetti-container';
document.body.appendChild(confettiContainer);

// Set default values for perspective property
// TweenLite.set("#confetti-container", {perspective:600})
let idx = 0;
function emoteRain(imageUrl) {

  // resize container to window size
  confettiContainer.innerWidth = window.innerWidth;
  confettiContainer.innerHeight = window.innerHeight;

  const numElements = 1;

  // load new elements into the page
  for (let i = 0; i < numElements; i++) {
    const element = document.createElement('div');
    element.id = idx;
    idx++;

    TweenLite.set(element, {
      className:'falling-element',
      x: Randomizer(0, innerWidth),
      y: Randomizer(-500, -450),
      z: Randomizer(-200, 200)
    });

    // switch between the images.
    element.style.background= `url(${imageUrl})`;
    element.style.backgroundSize= '100% 100%';

    confettiContainer.appendChild(element);

    // run animation
    runFallingAnimation(element);

    setTimeout(() => {
      document.getElementById(element.id).remove();
    }, 15000);
  }
}

function runFallingAnimation(element) {
  TweenMax.to(element, Randomizer(6, 16), {
    y: window.innerHeight+1400,
    ease: Linear.easeNone,
    repeat: 0,
    delay: -1
  });
  TweenMax.to(element, Randomizer(4, 8), {
    x: '+=100',
    rotationZ: Randomizer(0, 180),
    repeat: 4,
    yoyo: true,
    ease: Sine.easeInOut
  });
  TweenMax.to(element, Randomizer(2, 8), {
    rotationX: Randomizer(0,360),
    rotationY: Randomizer(0,360),
    repeat: 8,
    yoyo: true,
    ease: Sine.easeInOut,
    delay: -5
  });
}

function Randomizer(min, max) { return min + Math.random()*(max-min); }

window.playSFX = function (identifier, volume) {
  // console.log(amen_users);
  console.log("Is available: ", amen_users.includes(identifier));
  if(amen_users.includes(identifier)) {
    let sfx = new Audio(window.config.files_position + amen_list[identifier].filename);
    sfx.volume = volume;
    sfx.play();
    console.log("Played");
  }
}