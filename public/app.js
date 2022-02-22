const participants = document.getElementById('participants');
const localParticipant = document.getElementById('localParticipant');
const localIdentity = document.getElementById('localIdentity');
const remoteParticipant = document.getElementById('remoteParticipant');
const remoteIdentity = document.getElementById('remoteIdentity');
const login = document.getElementById('login');
const usernameInput = document.getElementById('username');
const joinLeaveButton = document.getElementById('joinOrLeave');
const shareScreen = document.getElementById('share_screen')

let connected = false;
let room;
var screenTrack;
// const addLocalVideo = async () => {
//   const videoTrack = await Twilio.Video.createLocalVideoTrack();
//   const trackElement = videoTrack.attach();
//   localParticipant.appendChild(trackElement);
// };

const connectOrDisconnect = async (event) => {
  event.preventDefault();
  if (!connected) {
    const identity = usernameInput.value;
    joinLeaveButton.disabled = true;
    joinLeaveButton.innerHTML = 'Connecting...';

    try {
      await connect(identity);
    } catch (error) {
      console.log(error);
      alert('Failed to connect to video room.');
      joinLeaveButton.innerHTML = 'Join Video Call';
      joinLeaveButton.disabled = false;
    }
  }
  else {
    disconnect();
  }
};

const connect = async (identity) => {
  const response = await fetch('/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      'identity': identity,
      'room': 'My Video Room'
    })
  });

  const data = await response.json();
  room = await Twilio.Video.connect(data.token);
  localIdentity.innerHTML = identity;

  room.participants.forEach(participantConnected);
  room.on('participantConnected', participantConnected);
  room.on('participantDisconnected', participantDisconnected);
  connected = true;

  joinLeaveButton.innerHTML = 'Leave Video Call';
  joinLeaveButton.disabled = false;
  usernameInput.style.display = 'none';
};

const disconnect = () => {
  room.disconnect();
  connected = false;
  remoteParticipant.lastElementChild.remove();
  remoteIdentity.innerHTML = '';
  localIdentity.innerHTML = '';
  joinLeaveButton.innerHTML = 'Join Video Call';
  usernameInput.style.display = 'inline-block';
};

const participantConnected = (participant) => {
  const tracksDiv = document.createElement('div');
  tracksDiv.setAttribute('id', participant.sid);
  remoteParticipant.appendChild(tracksDiv);
  remoteIdentity.innerHTML = participant.identity;

  participant.tracks.forEach(publication => {
    if (publication.isSubscribed) {
      trackSubscribed(tracksDiv, publication.track);
    }
  });

  participant.on('trackSubscribed', track => trackSubscribed(tracksDiv, track));
  participant.on('trackUnsubscribed', trackUnsubscribed);
};

const participantDisconnected = (participant) => {
  document.getElementById(participant.sid).remove();
  remoteIdentity.innerHTML = '';
};

// const trackSubscribed = (div, track) => {
//   const trackElement = track.attach();
//   div.appendChild(trackElement);
// };

// const trackUnsubscribed = (track) => {
//   track.detach().forEach(element => {
//     element.remove()
//   });
// };

function shareScreenHandler() {
  console.log('coming inside the share screen handler')
  event.preventDefault();
  if (!screenTrack) {
      navigator.mediaDevices.getDisplayMedia().then(stream => {
          screenTrack = new Twilio.Video.LocalVideoTrack(stream.getTracks()[0]);
          room.localParticipant.publishTrack(screenTrack);
          shareScreen.innerHTML = 'Stop sharing';
          screenTrack.mediaStreamTrack.onended = () => { shareScreenHandler() };
      }).catch(() => {
          alert('Could not share the screen.');
      });
  }
  else {
      room.localParticipant.unpublishTrack(screenTrack);
      screenTrack.stop();
      screenTrack = null;
      shareScreen.innerHTML = 'Share screen';
  }
};

function connectButtonHandler(event) {
  event.preventDefault();
  if (!connected) {
      // ...
      connect(username).then(() => {
          // ...
          shareScreen.disabled = false;
      }).catch(() => {
      // ...
     });
  }
 else {
      disconnect();
      shareScreen.innerHTML = 'Share screen';
      shareScreen.disabled = true;
  }
};

function addLocalVideo() {
  Twilio.Video.createLocalVideoTrack().then(track => {
      var video = document.getElementById('local').firstChild;
      var trackElement = track.attach();
      trackElement.addEventListener('click', () => { zoomTrack(trackElement); });
      video.appendChild(trackElement);
  });
};

function trackSubscribed(div, track) {
  var trackElement = track.attach();
  trackElement.addEventListener('click', () => { zoomTrack(trackElement); });
  div.appendChild(trackElement);
};

function zoomTrack(trackElement) {
  if (!trackElement.classList.contains('participantZoomed')) {
      // zoom in
      container.childNodes.forEach(participant => {
          if (participant.className == 'participant') {
              participant.childNodes[0].childNodes.forEach(track => {
                  if (track === trackElement) {
                      track.classList.add('participantZoomed')
                  }
                  else {
                      track.classList.add('participantHidden')
                  }
              });
              participant.childNodes[1].classList.add('participantHidden');
          }
      });
  }
  else {
      // zoom out
      container.childNodes.forEach(participant => {
          if (participant.className == 'participant') {
              participant.childNodes[0].childNodes.forEach(track => {
                  if (track === trackElement) {
                      track.classList.remove('participantZoomed');
                  }
                  else {
                      track.classList.remove('participantHidden');
                  }
              });
              participant.childNodes[1].classList.remove('participantHidden');
          }
      });
  }
};

function trackUnsubscribed(track) {
  track.detach().forEach(element => {
      if (element.classList.contains('participantZoomed')) {
          zoomTrack(element);
      }
      element.remove()
  });
};

shareScreen.addEventListener('click', shareScreenHandler);
login.addEventListener('submit', connectOrDisconnect);
addLocalVideo();