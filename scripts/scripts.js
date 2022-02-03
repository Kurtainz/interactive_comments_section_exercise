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
    const commentTemplate = document.getElementById('commentTemplate').content.cloneNode(true);

    if (isReply) {
        commentTemplate.firstElementChild.classList.add('reply');
    }

    // Set comment data
    commentTemplate.querySelector('.profileImage picture source').setAttribute('srcset', commentObj.user.image.webp);
    commentTemplate.querySelector('.profileImage picture img').setAttribute('src', commentObj.user.image.png);
    commentTemplate.querySelector('.profileName h2').innerText = commentObj.user.username;
    commentTemplate.querySelector('.postRecency p').innerText = createDateDescription(new Date(commentObj.createdAt));
    commentTemplate.querySelector('.commentText').innerText = commentObj.content;
    commentTemplate.querySelector('.rating').innerText = commentObj.score;

    // Add to screen
    const newCommentBox = document.getElementById('addComment');
    newCommentBox.parentNode.insertBefore(commentTemplate, newCommentBox);
}

const createDateDescription = date => {
    const currentDate = new Date(Date.now());
    const difference = Date.diff(currentDate, date);
    const timeframes = [
        'years',
        'months',
        'days',
        'weeks',
        'hours',
        'minutes',
        'seconds'
    ];
    let result = '';

    timeframes.some(timeframe => {
        const timeframeUnits = Math.floor(difference[timeframe]());

        if (timeframeUnits >= 1) {
            if (timeframeUnits === 1) {
                // Cut the 's' off the end
                timeframe = timeframe.substring(0, timeframe.length - 1);
            }
            result = `${timeframeUnits} ${timeframe} ago`;
            return true;
        }
    });

    return result;
}

getData().then(response => {
    localStorage.setItem('currentUserData', JSON.stringify(response.currentUser));
    localStorage.setItem('commentData', JSON.stringify(response.comments));
    setCurrentUserProfilePics();
    setComments();
});

const setCurrentUserProfilePics = () => {
    const currentUserData = JSON.parse(window.localStorage.getItem('currentUserData'));

    document.getElementById('webpProfile').setAttribute('srcset', currentUserData.image.webp);
    document.getElementById('pngProfile').setAttribute('src', currentUserData.image.png);
}

const setComments = () => {
    const comments = JSON.parse(window.localStorage.getItem('commentData'));

    comments.forEach(parentCommentObj => {
        addCommentToScreen(parentCommentObj);
        // Check for nested comments (replies)
        if (parentCommentObj.replies.length) {
            parentCommentObj.replies.forEach(replyObj => {
                addCommentToScreen(replyObj, true);
            });
        }
    });
}
