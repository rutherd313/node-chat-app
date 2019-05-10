const socket = io();

//Elements
//$ is conventional, vars comes from elem in the DOM
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $locationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

//Options
//Parses query strings inside location.search
//returns object with keys/values
const {username, room} = Qs.parse(location.search, { ignoreQueryPrefix: true }) //ignoreQueryPrefix = rids of ?

const autoscroll = () => {
    //New message element, since new messages are added to the bottom
    const $newMessage = $messages.lastElementChild;

    //height of new message
    const newMessageStyles = getComputedStyle($newMessage) //method is browser-available
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
        //offsetHeight does not take account margin, till newMessageMargin is added
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    //visible height, default screen height untill even as messages are added, then
    //scroll bar is added for extra height, but visible height remains the same.
    const visibleHeight = $messages.offsetHeight;

    //Height of messages container, totalheight able to see
    const containerHeight = $messages.scrollHeight;

    //num given for amount of distance scrolled from the top
    const scrollOffset = $messages.scrollTop + visibleHeight;

    //figure out if user is scrolled to the bottom b4 a new message is added 
    if (containerHeight - newMessageHeight <= scrollOffset) {
        //place scroll all the way to the bottom
        $messages.scrollTop = $messages.scrollHeight;
    }
}

//where templates will be rendered
socket.on('initMessage', (message) => {
    console.log(message);
    const html = Mustache.render(messageTemplate, { //generatemessage.js is referred
        username: message.username,
        message2: message.text, //since it(utils/messages.js) has two object props
        //https://momentjs.com/docs/#/parsing/string-format/
        createdAt: moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML("beforeend", html);
    autoscroll()
})

socket.on('locationMessage', (message) => {
    console.log(message);
    const url = Mustache.render(locationTemplate, {
        //chat.html {{}}
        username: message.username,
        location: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML("beforeend", url);
    autoscroll()
});

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html;
})

document.querySelector('#message-form').addEventListener('submit', (e) => {
    e.preventDefault()

    //disabling button after clicking
    $messageFormButton.setAttribute('disabled', 'disabled')
    const message = e.target.elements.message.value;

    //confirmation to the server
    socket.emit('sendMessage', message, (error) => {
        //enable button again
        $messageFormButton.removeAttribute('disabled');
        //clearing search bar
        $messageFormInput.value = '';
        //resets the cursor
        $messageFormInput.focus();

        if (error) {
            return console.log(error);
        }

        console.log('Message Delivered!'); //callback referrence index.js line 41
    });
})

$locationButton.addEventListener('click', () => { 
    //if exists, then client broswer supports, else it does not.
    if (!navigator.geolocation) {
        return alert('Your browser does not support geolocation');
    }
    $locationButton.setAttribute('disabled', 'disabled');

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {

            latitude: position.coords.latitude,
            longitude: position.coords.longitude

        }, () => { //callback referrence index.js, line 46
            $locationButton.removeAttribute('disabled');
            console.log('Location shared')
        })
    })
})

//will get called with an error if there are any, otherwise, 
//won't get called without one.
socket.emit('join', {username, room}, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})