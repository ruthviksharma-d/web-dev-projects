console.log("Welcome to soptify")

//initialize the variables
let songIndex=0;
let audioElement = new Audio('Apna Bana Le.mp3');
let masterPlay = document.getElementById('masterPlay');
let myProgressBar = document.getElementById('myProgressBar');
let gif = document.getElementById('gif');
let masterSongName = document.getElementById('masterSongName');
let songItems = Array.from(document.getElementsByClassName('songItem'));



let songs = [
    {songName: "Apna Bana Le", filePath: "Apna Bana Le.mp3", coverPath: "1.png"},
    {songName: "Maan Meri Jaan", filePath: "Maan Meri Jaan.mp3", coverPath: "2.png"},
    {songName: "Thousand years", filePath: "Thousand years.mp3", coverPath: "3.png"},
    {songName: "Tum Hi Ho", filePath: "Tum Hi Ho.mp3", coverPath: "4.png"},
    {songName: "Ve Haaniyaan", filePath: "Ve Haaniyaan.mp3", coverPath: "5.png"},
]
//audioElement.play();    //see this condition carefully or else it will play the song automatically


//handle the play and pause clicks
masterPlay.addEventListener('click', ()=>{
    if(audioElement.paused || audioElement.currentTime<=0){
        audioElement.play();
        masterPlay.classList.remove('fa-circle-play');
        masterPlay.classList.add('fa-circle-pause');
        gif.style.opacity = 1;
    }
    else{
        audioElement.pause();
        masterPlay.classList.remove('fa-circle-pause');
        masterPlay.classList.add('fa-circle-play');
        gif.style.opacity = 0;
    }
})
//listen to events
audioElement.addEventListener('timeupdate', ()=>{
    
    //update the progress bar
    progress = parseInt((audioElement.currentTime/audioElement.duration)*100);
   // console.log(progress); // see in the console to check the progress percentage
    myProgressBar.value = progress;
})

myProgressBar.addEventListener('change', ()=>{
    audioElement.currentTime = myProgressBar.value * audioElement.duration /100;
})

const makeAllPlays = ()=>{
    Array.from(document.getElementsByClassName('songItemPlay')).forEach((element)=>{
    element.classList.remove('fa-circle-pause');
    element.classList.add('fa-circle-play');
    })
}

Array.from(document.getElementsByClassName('songItemPlay')).forEach((element)=>{
    element.addEventListener('click', (e)=>{
        makeAllPlays();
        
        songIndex = parseInt(e.target.id);
        e.target.classList.remove('fa-circle-play');
        e.target.classList.add('fa-circle-pause');
        audioElement.src = songs[songIndex].filePath;
        masterSongName.innerText = songs[songIndex].songName;
        audioElement.currentTime=0;
        audioElement.play(); 
        gif.style.opacity = 1; 
        masterPlay.classList.remove('fa-circle-play');
        masterPlay.classList.add('fa-circle-pause');
    })
})

document.getElementById('next').addEventListener('click', ()=>{
    if(songIndex>=4){
        songIndex=0;
    }
    else{
    songIndex+=1;
    }
    audioElement.src = songs[songIndex].filePath;

    masterSongName.innerText = songs[songIndex].songName;
    audioElement.currentTime=0;
    audioElement.play();  
    masterPlay.classList.remove('fa-circle-play');
    masterPlay.classList.add('fa-circle-pause');

})

document.getElementById('previous').addEventListener('click', ()=>{
    if(songIndex<=0){
        songIndex=0;
    }
    else{
    songIndex-=1;
    }
    audioElement.src = songs[songIndex].filePath;

    masterSongName.innerText = songs[songIndex].songName;
    audioElement.currentTime=0;
    audioElement.play();  
    masterPlay.classList.remove('fa-circle-play');
    masterPlay.classList.add('fa-circle-pause');

})