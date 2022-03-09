const DateDiff = require('date-diff');
const sanitizeHtml = require('sanitize-html');

let topPostID = 0;

const getData = async () => {
    const response = await fetch('scripts/data.json');

    if (!response.ok) {
        console.log(response.status);
        return null;
    }

    return response.json();
}

const createCommentMarkup = (commentObj, isReply) => {
    const commentTemplate = document.getElementById('commentTemplate').content.cloneNode(true);
    const currentUserData = JSON.parse(window.localStorage.getItem('currentUserData'));

    // Set comment data
    commentTemplate.querySelector('.comment').setAttribute('data-id', commentObj.id);
    commentTemplate.querySelector('.profileImage picture source').setAttribute('srcset', commentObj.user.image.webp);
    commentTemplate.querySelector('.profileImage picture img').setAttribute('src', commentObj.user.image.png);
    commentTemplate.querySelector('.profileName h2').innerText = commentObj.user.username;
    commentTemplate.querySelector('.postRecency p').innerText = createDateDescription(new Date(commentObj.createdAt));
    commentTemplate.querySelector('.commentText').innerText = commentObj.content;
    commentTemplate.querySelector('.rating').innerText = commentObj.score;
    commentTemplate.querySelectorAll('.ratingButtons a')[0].setAttribute('data-id', commentObj.id);
    commentTemplate.querySelectorAll('.ratingButtons a')[1].setAttribute('data-id', commentObj.id);

    if (isReply) {
        const replyToName = createReplyToName(commentObj.replyingTo);

        commentTemplate.querySelector('.commentText').insertBefore(replyToName, commentTemplate.querySelector('.commentText').childNodes[0]);

        commentTemplate.firstElementChild.classList.add('reply');
    }

    // If the comment was created by the current user
    if (commentObj.user.username === currentUserData.username) {
        const youTag = createYouTag();
        const deleteButton = createCommentButton(commentObj.id, 'delete');
        const editButton = createCommentButton(commentObj.id, 'edit');
        const editBox = createEditBox(commentObj.content);
        const updateButton = createUpdateButton(commentObj.id);

        // Delete edit button
        commentTemplate.querySelector('.replyButton').remove();

        commentTemplate.querySelector('.comment').insertBefore(youTag, commentTemplate.querySelector('.comment').children[2]);
        commentTemplate.querySelector('.comment').insertBefore(editBox, commentTemplate.querySelector('.comment').children[5]);
        commentTemplate.querySelector('.comment').insertBefore(updateButton, commentTemplate.querySelector('.comment').children[7]);
        commentTemplate.querySelector('.comment').insertBefore(editButton, commentTemplate.querySelector('.comment').children[8]);
        commentTemplate.querySelector('.comment').insertBefore(deleteButton, commentTemplate.querySelector('.comment').children[8]);
    }

    return commentTemplate;
}

const createReplyToName = name => {
    const replyToName = document.createElement('span');

    replyToName.classList.add('replyToName');
    replyToName.innerText = `@${name} `;

    return replyToName;
}

const createYouTag = () => {
    const youTag = document.createElement('div');
    const innerParagraph = document.createElement('p');
    
    youTag.classList.add('you', 'flexCenter');

    innerParagraph.classList.add('flexCenter');
    innerParagraph.innerText = 'you';

    youTag.append(innerParagraph);

    return youTag;
}

const createCommentButton = (id, type) => {
    const button = document.createElement('a');
    const image = document.createElement('img');
    const text = document.createElement('p');
    const buttonData = {
        'delete': {
            'image': 'images/icon-delete.svg',
            'eventFunction': openModal
        },
        'edit': {
            'image': 'images/icon-edit.svg',
            'eventFunction': showHideEditElements
        }
    }

    button.classList.add(`${type}Button`);
    button.addEventListener('click', () => buttonData[type]['eventFunction'](id));
    button.append(image, text);
    image.src = buttonData[type]['image'];
    text.innerText = type[0].toUpperCase() + type.substring(1);

    return button;
}

const showHideEditElements = id => {
    const editElementClassNames = [
        'editBox',
        'updateButton',
        'commentText',
        'deleteButton',
        'editButton'
    ];

    editElementClassNames.forEach(className => {
        const element = document.querySelector(`[data-id="${id}"] .${className}`);
        let newDisplayProp = 'none';

        if (window.getComputedStyle(element).display === 'none') {
            newDisplayProp = 'block';
        }

        element.style.display = newDisplayProp;
    });

    // Set height of textarea to match content
    const editBox = document.querySelector(`[data-id="${id}"] .editBox`);

    editBox.style.height = editBox.scrollHeight + 'px';
}

const createEditBox = content => {
    const textBox = document.createElement('textarea');

    textBox.classList.add('editBox');
    textBox.value = content;

    return textBox;
}

const createUpdateButton = id => {
    const button = document.createElement('button');

    button.innerText = 'UPDATE';
    button.classList.add('updateButton');
    button.addEventListener('click', e => updateCommentText(e.currentTarget.previousElementSibling.value, id));

    return button;
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

const rateComment = (id, modifier) => {
    let comments = JSON.parse(window.localStorage.getItem('commentData'));

    comments = changeRating(id, comments, modifier);

    window.localStorage.setItem('commentData', JSON.stringify(comments));
}

const changeRating = (id, commentArr, modifier) => {
    commentArr.some(commentObj => {
        if (String(commentObj.id) === String(id)) {
            if (modifier === 'minus') {
                commentObj.score--;
            }
            else {
                commentObj.score++;
            }

            updateRatingNumberText(id, commentObj.score);

            return true;
        }
        if (commentObj.replies && commentObj.replies.length) {
            commentObj.replies = changeRating(id, commentObj.replies, modifier);
        }
    });

    return commentArr;
}

const updateRatingNumberText = (id, score) => document.querySelector(`.comment[data-id="${id}"] .rating`).innerText = score;

// Modal functions
const openModal = commentID => {
    const modal = document.getElementById('modal');
    
    modal.style.display = 'block';
    document.getElementById('deleteButton').setAttribute('data-id', commentID);
}

const closeModal = () => document.getElementById('modal').style.display = 'none';

// Auto resize textarea elements
// TODO Something about hover states? 
// TODO Desktop styles
// TODO Style modal

const setCurrentUserProfilePics = () => {
    const currentUserData = JSON.parse(window.localStorage.getItem('currentUserData'));

    document.getElementById('webpProfile').setAttribute('srcset', currentUserData.image.webp);
    document.getElementById('pngProfile').setAttribute('src', currentUserData.image.png);
}

const setComments = () => {
    const comments = JSON.parse(window.localStorage.getItem('commentData'));

    comments.forEach(parentCommentObj => {
        const newCommentBox = document.getElementById('addComment');
        const newComment = createCommentMarkup(parentCommentObj);

        // Add comment to screen
        newCommentBox.parentNode.insertBefore(newComment, newCommentBox);

        if (parentCommentObj.id > topPostID) {
            topPostID = parentCommentObj.id;
        }

        // Check for nested comments (replies)
        if (parentCommentObj.replies.length) {
            const replyContainer = createReplyContainer();

            parentCommentObj.replies.forEach(replyObj => {
                const commentReply = createCommentMarkup(replyObj, true);

                replyContainer.append(commentReply);

                if (replyObj.id > topPostID) {
                    topPostID = replyObj.id;
                }
            });

            newCommentBox.parentNode.insertBefore(replyContainer, newCommentBox);
        }
    });
}

const createReplyContainer = () => {
    const repliesContainer = document.createElement('div');
    const replyLine = document.createElement('div');

    repliesContainer.classList.add('repliesContainer');
    replyLine.classList.add('replyLine');

    repliesContainer.append(replyLine);

    return repliesContainer;
}

// Delete posts functions
const deletePost = id => {
    disablePost(id);
    removePostFromStorage(id);
    removePostFromDOM(id);
}

const disablePost = id => {
    document.querySelector(`[data-id="${id}"]`).style.backgroundColor = '#e4e4e4';
    document.querySelector(`[data-id="${id}"]`).style.cursor = 'not-allowed';
    document.querySelectorAll(`[data-id="${id}"] a`).forEach(link => {
        link.style.cursor = 'not-allowed';
        link.href = 'javascript:void(0)'
    });
}

const removePostFromStorage = id => {
    let commentData = JSON.parse(window.localStorage.getItem('commentData'));

    commentData = commentData.filter(commentObj => {
        if (commentObj.replies.length) {
            commentObj.replies = commentObj.replies.filter(replyObj => String(replyObj.id) !== String(id));
        }

        return String(commentObj.id) !== String(id);
    });

    window.localStorage.setItem('commentData', JSON.stringify(commentData));
}

const removePostFromDOM = id => document.querySelector(`[data-id="${id}"]`).remove();

const createNewComment = (text, replyID) => {
    if (text.length > 300) {
        commentError();
        return;
    }

    topPostID++;

    let commentData = JSON.parse(window.localStorage.getItem('commentData'));
    const currentUserData = JSON.parse(window.localStorage.getItem('currentUserData'));
    const newComment = {
        "id": topPostID,
        "content": text,
        "createdAt": new Date().toISOString(),
        "score": 0,
        "user": {
          "image": { 
            "png": currentUserData.image.png,
            "webp": currentUserData.image.webp
          },
          "username": currentUserData.username
        }
    }

    if (replyID) {
        const replyingToObj = commentData.find(obj => String(obj.id) === String(replyID));
        newComment.replyingTo = replyingToObj.user.username;
        replyingToObj.replies.push(newComment);
    }
    else {        
        newComment.replies = [];
        commentData.push(newComment);
    }

    window.localStorage.setItem('commentData', JSON.stringify(commentData));
    return newComment;
}

const updateCommentText = (text, id) => {
    if (text.length > 300) {
        commentError();
        return;
    }

    let commentData = JSON.parse(window.localStorage.getItem('commentData'));
    const commentObj = findReplyFromID(id, commentData);

    commentObj.content = sanitizeHtml(text, {
        allowedTags: [],
        allowedAttributes: []
    });

    window.localStorage.setItem('commentData', JSON.stringify(commentData));

    document.querySelector(`[data-id="${id}"] .commentText`).innerText = text;
    showHideEditElements(id);
}

const findReplyFromID = (id, commentData) => {
    let result;

    commentData.some(obj => {
        if (String(obj.id) === String(id)) {
            result = obj;
            return true;
        }
        else {
            const inReplyObj = obj.replies.some(replyObj => {
                if (String(replyObj.id) === String(id)) {
                    result = replyObj;
                    return true;
                }
            });
            if (inReplyObj) {
                return true;
            }
        }
    });

    return result;
}

const commentError = () => {
    const errorElement = document.getElementById('commentError');

    errorElement.classList.add('fadeInOut');
}

const createReplyBox = id => {
    const replyBox = document.getElementById('reply').content.cloneNode(true);
    const currentUserData = JSON.parse(window.localStorage.getItem('currentUserData'));
    const replyingToElem = document.querySelector(`[data-id="${id}"]`);

    replyBox.querySelector('.replyBox').setAttribute('parent-id', id);
    replyBox.querySelector('picture source').srcset = currentUserData.image.webp;
    replyBox.querySelector('picture img').src = currentUserData.image.png;
    replyBox.querySelector('.replySendButton button').addEventListener('click', e => {
        const commentText = e.currentTarget.parentElement.previousElementSibling.previousElementSibling.children[0].value;
        const newCommentObj = createNewComment(commentText, id);
        if (newCommentObj) {
            const newCommentMarkup = createCommentMarkup(newCommentObj, id);
            
            removeReplyBox(id);
            
            if (replyingToElem.nextElementSibling.classList.contains('repliesContainer')) {
                replyingToElem.nextElementSibling.append(newCommentMarkup);
            }
            else {
                const replyContainer = createReplyContainer();
    
                replyContainer.append(newCommentMarkup);
                document.body.insertBefore(replyContainer, replyingToElem.nextElementSibling);
            }
        }
    });

    // Have to add it differently if it's replying to a reply
    if (replyingToElem.classList.contains('reply')) {
        replyingToElem.parentElement.append(replyBox);
    }
    else {
        document.body.insertBefore(replyBox, replyingToElem.nextElementSibling);
    }
}

const removeReplyBox = id => document.querySelector(`[parent-id="${id}"]`).remove();

if (!window.localStorage.getItem('commentData') || !window.localStorage.getItem('currentUserData')) {
    console.log('Getting data');
    getData().then(response => {
        localStorage.setItem('currentUserData', JSON.stringify(response.currentUser));
        localStorage.setItem('commentData', JSON.stringify(response.comments));
        setCurrentUserProfilePics();
        setComments();
    });
}
else {
    setCurrentUserProfilePics();
    setComments();
}

// Rating button listeners
document.querySelectorAll('.ratingButtons a').forEach(button => {
    // This will be used to disable the listener function so a comment can't be rated more than once
    const controller = new AbortController();

    button.addEventListener('click', e => {
        e.preventDefault();

        const modifier = e.currentTarget.getAttribute('data-modifier');
        const id = e.currentTarget.getAttribute('data-id');
        
        rateComment(id, modifier);

        // Highlight the selected rating and prevent from redirecting
        e.currentTarget.classList.add('selected');
        e.currentTarget.href = 'javascript:void(0)';

        // Remove listener so it can't be called again
        controller.abort();
    }, { signal: controller.signal });
});

// Set modal listeners
document.getElementById('modal').addEventListener('click', closeModal);
document.getElementById('cancelButton').addEventListener('click', closeModal);
window.onclick = e => {
    const modal = document.getElementById('modal');

    if (e.target === modal) {
        closeModal();
    }
}
document.getElementById('deleteButton').addEventListener('click', e => deletePost(e.target.getAttribute('data-id')));

// Create new comment
document.getElementById('sendButton').addEventListener('click', () => {
    let commentText = document.getElementById('newComment').value;
    const newCommentObj = createNewComment(commentText);
    if (newCommentObj) {
        const newCommentMarkup = createCommentMarkup(newCommentObj);
        const newCommentBox = document.getElementById('addComment');
    
        document.body.insertBefore(newCommentMarkup, newCommentBox);
        document.getElementById('newComment').value = '';
    }
});

// Listeners for reply buttons
document.querySelectorAll('.replyButton').forEach(button => {
    const id = button.parentElement.getAttribute('data-id');
    const controller = new AbortController();
    
    button.addEventListener('click', e => {
        e.preventDefault();
        
        createReplyBox(id);

        // Disable listener and reply button
        e.currentTarget.href = 'javascript:void(0)';
        controller.abort();
    }, { signal: controller.signal });
});

// Remove animation class on error message in case it needs to be used again
window.addEventListener('animationend', e => {
    if (e.target.id === 'commentError') {
        e.target.classList.remove('fadeInOut');
    }
});