const DateDiff = require('date-diff');

const getData = async () => {
    const response = await fetch('scripts/data.json');

    if (!response.ok) {
        console.log(response.status);
        return null;
    }

    return response.json();
}

const createNewComment = (commentObj, isReply) => {
    const commentTemplate = document.getElementById('commentTemplate').content.cloneNode(true);
    const currentUserData = JSON.parse(window.localStorage.getItem('currentUserData'));

    // Set comment data
    commentTemplate.querySelector('.profileImage picture source').setAttribute('srcset', commentObj.user.image.webp);
    commentTemplate.querySelector('.profileImage picture img').setAttribute('src', commentObj.user.image.png);
    commentTemplate.querySelector('.profileName h2').innerText = commentObj.user.username;
    commentTemplate.querySelector('.postRecency p').innerText = createDateDescription(new Date(commentObj.createdAt));
    commentTemplate.querySelector('.commentText').innerText = commentObj.content;
    commentTemplate.querySelector('.rating').innerText = commentObj.score;

    if (isReply) {
        const replyToName = document.createElement('span');

        replyToName.classList.add('replyToName');
        replyToName.innerText = `@${commentObj.replyingTo} `;
        commentTemplate.querySelector('.commentText')
        .insertBefore(replyToName, commentTemplate.querySelector('.commentText').childNodes[0]);

        commentTemplate.firstElementChild.classList.add('reply');
    }

    // If the comment was created by the current user
    if (commentObj.user.username === currentUserData.username) {
        const youTag = document.createElement('div');
        const innerParagraph = document.createElement('p');
        const deleteIcon = document.createElement('a');
        const deleteImage = document.createElement('img');
        const deleteText = document.createElement('p');

        youTag.classList.add('you', 'flexCenter');

        innerParagraph.classList.add('flexCenter');
        innerParagraph.innerText = 'you';

        deleteIcon.classList.add('deleteButton');
        deleteIcon.addEventListener('click', () => openModal(commentObj.id));
        deleteIcon.append(deleteImage, deleteText);
        deleteImage.src = 'images/icon-delete.svg';
        deleteText.innerText = 'Delete';

        // Change reply button to edit
        commentTemplate.querySelector('.replyButton').classList.add('editButton');
        commentTemplate.querySelector('.replyButton img').src = 'images/icon-edit.svg';
        commentTemplate.querySelector('.replyButton p').innerText = 'Edit';

        commentTemplate.querySelector('.replyButton').style.marginLeft = '0';

        youTag.append(innerParagraph);
        commentTemplate.querySelector('.comment').insertBefore(youTag, commentTemplate.querySelector('.comment').children[2]);
        commentTemplate.querySelector('.comment').insertBefore(deleteIcon, commentTemplate.querySelector('.comment').children[6]);
    }

    return commentTemplate;
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

const openModal = commentID => {
    const modal = document.getElementById('modal');
    
    modal.style.display = 'block';
    document.getElementById('deleteButton').setAttribute('data-id', commentID);
}

// TODO Create modal functions, e.g., Delete post and close modal
// TODO Style modal
// TODO Desktop styles
// TODO Create functionality for post ratings (use localStorage)
// TODO Create functionality for creating new posts and replies (use localStorage)
// TODO Something about hover states? 

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
        const newCommentBox = document.getElementById('addComment');
        const newComment = createNewComment(parentCommentObj);

        // Add comment to screen
        newCommentBox.parentNode.insertBefore(newComment, newCommentBox);

        // Check for nested comments (replies)
        if (parentCommentObj.replies.length) {
            const repliesContainer = document.createElement('div');
            const replyLine = document.createElement('div');

            repliesContainer.classList.add('repliesContainer');
            replyLine.classList.add('replyLine');

            repliesContainer.append(replyLine);

            parentCommentObj.replies.forEach(replyObj => {
                const commentReply = createNewComment(replyObj, true);

                repliesContainer.append(commentReply);
            });

            newCommentBox.parentNode.insertBefore(repliesContainer, newCommentBox);
        }
    });
}
