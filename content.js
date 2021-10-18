var allQuestions = [], allAnswers, type, c = [],
types = [
    ['quantumWizTextinputPapertextareaInput exportTextarea', 'text'],
    ['quantumWizTextinputPaperinputInput exportInput', 'text'],
    ['freebirdFormviewerComponentsQuestionRadioChoicesContainer', 'choices'],
    ['freebirdFormviewerComponentsQuestionGridContainer', 'container']
];
var containers = document.getElementsByClassName('freebirdFormviewerViewNumberedItemContainer');
let modalContent = document.createElement("div")
let modal = document.createElement("div")
css = `
.modal {
    display: none; /* Hidden by default */
    position: fixed; /* Stay in place */
    z-index: 1; /* Sit on top */
    left: 0;
    top: 0;
    width: 100%; /* Full width */
    height: 100%; /* Full height */
    overflow: auto; /* Enable scroll if needed */
    background-color: rgb(0,0,0); /* Fallback color */
    background-color: rgba(0,0,0,0.4); /* Black w/ opacity */
}

.modal-content {
    position: relative;
    background-color: #fefefe;
    margin: 15% auto; /* 15% from the top and centered */
    padding: 20px;
    border: 1px solid #888;
    width: 80%; /* Could be more or less, depending on screen size */
}
.button-modal.active:hover{ 
    filter: brightness(150%);
    transition: 750ms;
}
.button-modal.active {
    background-color: green;
    transition: 550ms;
}
.button-modal {
    top: 20px;
    right: 20px;
    width: 30px;
    height: 30px;
    position: absolute;
    box-shadow: 3px 2px 5px black;
    background-size: cover;
    background-image: url(${chrome.runtime.getURL("images/bloco.png")});
    background-color: grey;

}
#link {
    position: absolute;
    top: 20px;
    right: 20px;
    width: 30px;
    height: 30px;
    background-size: cover;
    background-image: url(${chrome.runtime.getURL("images/link.png")});
    text-decoration: none;
}
`

function createModalBox(event) {
    let element = event.target
    let elementid = element.id.substr(element.id.length - 1)

    link = document.createElement("a")
    // link.textContent = "Visitar"
    link.setAttribute("id", "link")
    link.setAttribute("href", allAnswers[elementid].url)
    modalContent.appendChild(link)

    
    let title = document.createElement("div")
    title.innerHTML = allAnswers[elementid].title
    modalContent.appendChild(title)

    for (i of allAnswers[elementid].modalAnswers) {
        let div = document.createElement("div")
        div.innerHTML = i
        modalContent.appendChild(document.createElement("hr"))
        modalContent.appendChild(div)
    }
    modal.style.display = "block";
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
        modalContent.innerHTML = ""
    }
}

if (window.location.toString().includes('.google.com/forms/')) {
    console.log("Colando Rapaz :/");
    modal.setAttribute("id", "myModal")
    modal.setAttribute("class", "modal")
    modalContent.setAttribute("class", "modal-content")
    modal.appendChild(modalContent)

    let style = document.createElement('style');

    if (style.styleSheet) {
        style.styleSheet.cssText = css;
    } else {
        style.appendChild(document.createTextNode(css));
    }
    modal.appendChild(style)
    document.body.appendChild(modal)

    for (let i = 0; i < containers.length; i++) {
        let container = containers[i],
        question = container.getElementsByClassName('freebirdFormviewerComponentsQuestionBaseTitle exportItemTitle freebirdCustomFont')[0];

        container.style.position = "relative"
        button = document.createElement("div")
        button.setAttribute("class", "button-modal")
        button.setAttribute("id", "button"+i)
        button.addEventListener("click", createModalBox)
        container.appendChild(button)

        for (t of types) {
            if (container.getElementsByClassName(t[0])[0]) {
                type = t;
                break;
            }
        }
        if (!type || !question) {
            allQuestions.push(
                {
                "question": '',
                "type": undefined,
                "class": undefined
                }
            )
        } else {
            allQuestions.push(
                {
                "question": question.textContent,
                "type": type[1],
                "class": type[0]
                }
            )
        }
    }
}
allQuestions = {"content": allQuestions, "from": "content"};

function setAnswer(message) {
    for (let i = 0; i < containers.length; i++) {
        let response = message[i], container = containers[i];
        if (response.type == "text"){
            if (!container.getElementsByClassName(response.class)[0].value) {
            let a = response.answers[0].trim();
            try {
                container.getElementsByClassName(response.class)[0].focus();
            } catch (error) {
                container.getElementsByClassName('quantumWizTextinputPaperinputInput exportInput')[0].focus();
            }
            document.execCommand('insertText', false, a);
            message[i].answerid=1;
            container.getElementsByClassName(response.class)[0].style.height = parseInt(container.getElementsByClassName(response.class)[0].style.height.replace('px', '')) + 1 + 'px';
            }
        }
    }
}



function deleteAnswers() {
    for (container of containers) {
        try {
            container.getElementsByClassName('quantumWizTextinputPapertextareaInput exportTextarea')[0].select();
        } catch {}
        try {
            container.getElementsByClassName('quantumWizTextinputPaperinputInput exportInput')[0].select();
        } catch {}
        document.execCommand('delete');
        
    }
}

function nextAnswer(response) {
    for (let i = 0; i < containers.length; i++) {
        let container = containers[i], questions = response[i];
        if (container.getElementsByClassName('isFocused')[0]) {
            let b = (questions.answerid) % (questions.answers.length);
            container.getElementsByClassName(questions.class)[0].select();
            document.execCommand('insertText', false, questions.answers[b].trim());
            questions.answerid = b + 1;
            try {
                container.getElementsByClassName('exportTextarea')[0].style.height = parseInt(container.getElementsByClassName('exportTextarea')[0].style.height.replace('px', '')) + 1 + 'px';
            } catch (error) {
                container.getElementsByClassName('exportInput')[0].style.height = parseInt(container.getElementsByClassName('exportInput')[0].style.height.replace('px', '')) + 1 + 'px';
            }
        }
    }
}

chrome.runtime.onMessage.addListener(displayAnswers);


chrome.runtime.sendMessage(allQuestions, function (response) {
    allAnswers = response.allAnswers;
    for (i=0; i < allAnswers.length ; i++) {
        let answer = allAnswers[i], container = containers[i]
        if (answer.title) container.getElementsByClassName("button-modal")[0].classList.add("active")
    }
})

function displayAnswers(request, sender, sendResponse) {
    switch (request.from) {
        case 'contextResponder':
            nextAnswer(allAnswers);
            break;
        case 'contextLexical':
            chrome.runtime.sendMessage({'from': 'contextLexical', 'content': request.text}, function (response) {
                document.execCommand('insertText', false, response.content)
            });
            break;
        case 'popup-fill':
            setAnswer(allAnswers);
            break;
        case 'popup-del':
            deleteAnswers();
            break;
    }
    sendResponse({status: true});
}