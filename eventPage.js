var proximaResposta = {
    "id": "proxima",
    "title": "Próxima Resposta",
    "contexts": ["editable"]
}

var mudancaLexical = {
    "id": "lexical",
    "title": "Mudança Lexical",
    "contexts": ["selection"]
}

chrome.contextMenus.removeAll(function() {
    chrome.contextMenus.create(proximaResposta);
    chrome.contextMenus.create(mudancaLexical);
});

chrome.contextMenus.onClicked.addListener(function (clickData){
    let from, text;
    if (clickData.menuItemId == 'proxima') { from='contextResponder' } else { from='contextLexical'; text=clickData.selectionText}
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {'from': from, 'text': text}, function(response) {});
    })
})
