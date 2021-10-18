var answersinfo;

window.onload = function() {
    var ul = document.getElementById('dynamic-results');
    
    displayAnswers(false)

    async function buttons(from){
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {'from': from});
        })
    }

    document.getElementById('fill').onclick = () => buttons('popup-fill');
    document.getElementById('del').onclick = () => buttons('popup-del');


    document.getElementById('searchSubmit').onclick = function () {
        getAnswers()}

    document.getElementById('searchBar').addEventListener('keyup', function (event) {
        if (event.keyCode === 13) {getAnswers();}
    })

    async function getAnswers() {
        if (!document.getElementById('searchBar').value.trim()) {return;}
        document.getElementsByClassName('spinner')[0].style.display = 'unset';
        ul.innerHTML = '';
        chrome.runtime.sendMessage({'from': 'popup', 'content': document.getElementById('searchBar').value.trim()}, function (response) {
            displayAnswers()
        })
    }

    async  function displayAnswers(check=true) {
        let resolveMes = new Promise(function(resolve, reject){
            chrome.storage.local.get(['content'], function(options){ resolve(options); })
        });
        response = await resolveMes
        document.getElementsByClassName('spinner')[0].style.display = 'none';
        if (response.content.length < 1 && check) {
            let p = document.createElement('p');
            p.appendChild(document.createTextNode('Não foi possivel achar uma resposta :('));
            ul.appendChild(p);
            return;
        }
        console.log(response);
        answersinfo = response.content
        for (i=0; i < answersinfo.length; i++) {
            let li = document.createElement('div')
            li.setAttribute('id', 'answer' + i);
            li.setAttribute('class', 'answer-result');
            li.appendChild(document.createTextNode(answersinfo[i].title[0]));
            ul.appendChild(li);
            li.onclick = event => {
                document.getElementsByClassName('content-header')[0].style.display = 'none';
                document.getElementsByClassName('result-page')[0].style.display = 'block';
                answerPage(event.target.id.substr(-1));
                
            }
        }
    }

    document.getElementById('result-return').onclick = function() {
        document.getElementsByClassName('content-header')[0].style.display = 'unset';
        document.getElementsByClassName('result-page')[0].style.display = 'none';
        document.getElementsByClassName('result-content')[0].innerHTML = '';
    }

    async function answerPage(i) {
        let answer = answersinfo[i];
        var question = document.createElement('div');
        question.setAttribute('id', 'result-title');
        question.innerHTML = answer.title[1];

        var questionurl = document.createElement('a');
        questionurl.setAttribute('href', answer.url);
        questionurl.setAttribute('target', '_blank');
        questionurl.appendChild(question);
        document.getElementsByClassName('result-content')[0].appendChild(questionurl);

        for (i=0; i < answer.answers.length; i++) {
            let content = document.createElement('div');
            content.setAttribute('class', 'result-answer');
            content.innerHTML = answer.answers[i];

            let copiar = document.createElement('button');
            copiar.setAttribute('class', 'result-copiar');
            copiar.setAttribute('id', 'copiar' + i);
            copiar.appendChild(document.createTextNode('Copiar'));

            document.getElementsByClassName('result-content')[0].appendChild(document.createElement('hr'));
            content.appendChild(copiar);
            document.getElementsByClassName('result-content')[0].appendChild(content);

            copiar.onclick = event => {
                let input = document.createElement('textarea');
                input.innerHTML = correctAnswer(event.target.parentElement.textContent);
                document.body.appendChild(input);
                input.select();
                document.execCommand('copy');
                document.body.removeChild(input);
             }
                
            }
        questionurl.scrollIntoView();
    }

    function correctAnswer(answers) {
        i = answers.trim().slice(0, -6);
        if (i.toLowerCase().startsWith('resposta:')) {
            i = i.slice(9).trim();}
        if (i.toLowerCase().startsWith('explicação:')) {
            i = i.slice(11).trim();}
        if (i.toLowerCase().endsWith('explicação:')) {
            i = i.slice(0,-11).trim();} 
        if (i.toLowerCase().endsWith('explicação passo-a-passo:')) {
            i = i.slice(0, -25).trim();}
        i = i.trim();
        return i;
    }
}
