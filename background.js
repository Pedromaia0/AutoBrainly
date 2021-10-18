async function fetchData(urls, encoding="UTF-8") {
    let string;
    if (typeof(urls) == "string") {urls = [urls], string = true;}
    let texts = (await Promise.allSettled(urls.map(async url => {
        if (url) {
            const resp = await fetch(url);
            if (encoding != "UTF-8") return resp.arrayBuffer();
            if (resp.status == 200) return resp.text();
        }
    })))
    if (encoding != "UTF-8") {
        texts = texts.map(i => {
            const decoder = new TextDecoder(encoding);
            return {value: decoder.decode(i.value)}
        });
    }
    texts = texts.map(i => {if (i.value) {parser=new DOMParser();return parser.parseFromString(i.value,"text/html")}})
    if (string) {console.log(texts); return texts[0]}
    return texts;
}

function convertQuestion(question) {
    question = encodeURIComponent(question)
    if (question.endsWith('*')) {question = question.slice(0, -1);}
    if (question.endsWith('+')) {question = question.slice(0, -1);}

    return "site%3abrainly.com.br+" + question;
}

function correctAnswer(answers) {
    let result = [];
    for (i of answers) {
        i = i.textContent.trim();
        if (i.toLowerCase().startsWith("resposta:")) {
            i = i.slice(9);}
        if (i.toLowerCase().startsWith("explicação:")) {
            i = i.slice(11);}
        if (i.toLowerCase().endsWith("explicação:")) {
            i = i.slice(0,-11);} 
        result.push(i);}
    return result;
}

async function getAnswer(questions) {
    let urls = await fetchData(questions.map(x => {return "https://www.bing.com/search?q=" + convertQuestion(x.question)}))
    links = urls.map(i => {
        let src = i.getElementsByClassName('b_algo');
        for (j of src) {
            let link = j.getElementsByTagName('a')[0].href
            if (link.includes("brainly.com.br/t")) {return link; break;}
        }
    })
    let pages = await fetchData(links)
    let allAnswers = [];
    for ([dados, url, page] of questions.map((x,i) => {return [x, links[i], pages[i]]})) {
        let contents = {
            "url": "",
            "answers": "",
            "modalAnswers": "",
            "title": "",
            "type": dados.type,
            "class": dados.class,
            "answerid" : 0
        };
        if (dados.question.toLowerCase().includes('aluno') && dados.id < 2) {
            contents.url = "Seu Nome :)";
            contents.answers = ["Seu nome :)"];
            allAnswers.push(contents)
            continue;
        }
        if (!page) {
            contents.answers = ["Não foi possível achar uma resposta :("];
            allAnswers.push(contents)
            continue;
        }
        contents.title = page.getElementsByClassName('brn-qpage-next-question-box-content ')[0].innerHTML
        contents.modalAnswers = [...page.getElementsByClassName('sg-text sg-text--break-words brn-rich-content js-answer-content')].map(x => {return x.innerHTML})
        page = page.getElementsByClassName('sg-text sg-text--break-words brn-rich-content js-answer-content');
        contents.url = url;
        contents.answers = correctAnswer(page);
        allAnswers.push(contents)
    }
    return allAnswers
}

async function popupAnswers(question) {
    question = convertQuestion(question);
    let src = [...(await fetchData('https://www.bing.com/search?q=' + question)).getElementsByClassName('b_algo')];
    let allAnswers = [], urls = src.map(i => {
        let a = i.getElementsByTagName('a')[0].href
        if (a.includes('brainly.com.br/t')) {return a;}
    });
    let texts = await fetchData(urls)
    
    for ([url, page] of urls.map((url, i) => {return [url, texts[i]]})) {
        if (page) {
            let qst = [page.getElementsByClassName('brn-qpage-next-question-box-content')[0].textContent.trim(), page.getElementsByClassName('brn-qpage-next-question-box-content ')[0].innerHTML];
            let ansr = [];
            for (i of page.getElementsByClassName('sg-text sg-text--break-words brn-rich-content js-answer-content')) {ansr.push(i.innerHTML);}
            allAnswers.push({
                'title': qst,
                'answers': ansr,
                'url': url
            })
        }
    }
    return allAnswers;
}

async function getSynonymous(text) {
    let words = [];
    list = text.replace(/,/, '').split(' ');
    for (i=0; i < Math.ceil(list.length / 5); i++) {
        word = list[Math.floor(Math.random() * list.length)].replace(/[-'`~!@#$%^&*()_|+=?;:'",.<>\{\}\[\]\\\/]/gi, '');
        if (!words.includes(word) && word.length > 4 && word[0] !== word[0].toUpperCase()) {words.push(word);} else {i--;}
        if (i < -10) {break;}
    }
    let sino = await fetchData(words.map(x => {return 'https://www.sinonimos.com.br/' + x.normalize("NFD").replace(/\p{Diacritic}/gu, "")}), "windows-1252")
    for ([word, page] of words.map((x, i) => {return [x, sino[i]]})) {
        if (!page) continue
        try {text = text.replace(word, page.getElementsByClassName('sinonimo')[0].textContent);} catch{}
    }
    return text;
}

async function handleMessages(request, sender, sendResponse) {
    switch (request.from) {
        case 'content':
            var allQuestions = [];
            sendResponse({"allAnswers": await getAnswer(request.content)});
            break;
    
        case 'popup':
            chrome.storage.local.set({"content": await popupAnswers(request.content)});
            sendResponse({'status': true})
            break;

        case 'contextLexical':
            sendResponse({'content': await getSynonymous(request.content)})
            break;
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    handleMessages(request,sender,sendResponse)
    return true;
});
