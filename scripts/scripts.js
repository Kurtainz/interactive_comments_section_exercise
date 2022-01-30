const DateDiff = require('date-diff');

const getData = async () => {
    const response = await fetch('scripts/data.json');

    if (!response.ok) {
        console.log(response.status);
        return null;
    }

    return response.json();
}

const addCommentToScreen = (commentObj, isReply) => {
    // Need to ensure ID is changed
    const commentTemplate = document.getElementById('commentTemplate').content.cloneNode(true);

    // Set comment data
    commentTemplate.querySelector('.profileImage picture source').setAttribute('srcset', commentObj.user.image.webp);
    commentTemplate.querySelector('.profileImage picture img').setAttribute('src', commentObj.user.image.png);
    commentTemplate.querySelector('.profileName h2').innerText = commentObj.user.username;
    commentTemplate.querySelector('.postRecency p').innerText = createDateDescription(new Date(commentObj.createdAt));
    commentTemplate.querySelector('.commentText').innerText = commentObj.content;

    // Add to screen
    document.querySelector('body').insertBefore(commentTemplate, document.querySelector('body').childNodes[0]);
}

const createDateDescription = date => {
    const currentDate = new Date(Date.now());
    const difference = Date.diff(currentDate, date);

    return '2 Weeks Ago';
}

getData().then(response => {
    localStorage.setItem('currentUserData', JSON.stringify(response.currentUser));
    localStorage.setItem('commentData', JSON.stringify(response.comments));
});

// TODO add profile image for new comment box

// TODO append to screen using template
const comments = JSON.parse(window.localStorage.getItem('commentData'));

comments.forEach(parentCommentObj => {
    addCommentToScreen(parentCommentObj);
});

// const init = () => {
//     const getData = async () => {
//         const response = await fetch('scripts/data.json');

//         if (!response.ok) {
//             console.log(response.status);
//             return null;
//         }

//         return response.json();
//     }

//     const addCommentToScreen = (commentObj, isReply) => {
//         // Need to ensure ID is changed
//         const commentTemplate = document.getElementById('commentTemplate').content.cloneNode(true);

//         // Set profile images
//         commentTemplate.querySelector('.profileImage picture source').setAttribute('srcset', commentObj.user.image.webp);
//         commentTemplate.querySelector('.profileImage picture img').setAttribute('src', commentObj.user.image.png);

//         commentTemplate.querySelector('.profileName h2').innerText = commentObj.user.username;
//         commentTemplate.querySelector('.postRecency p').innerText = commentObj.user.username;
//         commentTemplate.querySelector('.postRecency p').innerText = commentObj.user.username;

//     }

//     const createDateDescription = date => {

//     }

//     getData().then(response => {
//         localStorage.setItem('currentUserData', JSON.stringify(response.currentUser));
//         localStorage.setItem('commentData', JSON.stringify(response.comments));
//     });

//     // TODO add profile image for new comment box

//     // TODO append to screen using template
//     const comments = JSON.parse(window.localStorage.getItem('commentData'));

//     comments.forEach(parentCommentObj => {

//     });
// }

// window.onload = init();