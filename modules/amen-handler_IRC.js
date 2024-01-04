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
const client = new tmi.Client({
  channels: [ 'piethelemon']
});

client.connect();
// Info for the possilbe tags: https://dev.twitch.tv/docs/irc/tags/#privmsg-tags
await client.on('chat', (channel, tags, message, self) => {
  if (self) return;
  let sender = tags['user-id'];

  // console.log(message);
  // console.log(tags);
  // console.log(amen_users);
  // console.log("User included: ", amen_users.includes(sender));

  // First case: checks for the !testamen #TWITCHID #VOLUME command (volume must be a number)
  if (message.toLowerCase().substring(0,9) === '!testamen' && tags['badges'] != null) {
    if ('broadcaster' in tags['badges'] && tags['badges']['broadcaster'] == 1) {
      console.log("recognized the testamen command");
      let index_id = message.indexOf(' ');
      let index_volume = message.lastIndexOf(' ');
      let id = message.substring(index_id+1,index_volume);
      let volume = Number.parseFloat(message.substring(index_volume+1));
      console.log("ID that will be played:", id);
      console.log("Volume at which will be played:", volume);
      playSFX(id, volume);
    }
  }
  // PieTheLemon ID: 68866589
  // LupoMarcio ID: 88803358
  // FesterBot ID: 173663394
  else if (sender === '88803358' && message === 'Amen, Allupati!!') {
    pray_active = true;
    counter = 0;
    console.log(pray_active);
  }
  else if (sender === '173663394' && message === 'Bonkate in pace!') {
    pray_active = false;
    counter = 0;
    console.log(pray_active);
  }
  else if (message.toLowerCase().includes("amen") && pray_active) {
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