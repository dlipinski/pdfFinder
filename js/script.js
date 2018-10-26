//jshint browser: true, esversion: 6, devel:true, jquery:true
jQuery.fn.center= function () {
    this.css("top", Math.max(0, (($(window).height() - $(this).outerHeight()) / 2) + 
                                                $(window).scrollTop()) + "px");
    this.css("left", Math.max(0, (($(window).width() - $(this).outerWidth()) / 2) + 
                                                $(window).scrollLeft()) + "px");
    return this;
};

const showLoading = () => { 
    $('#blurer').height($(document).height());
    $('#blurer').fadeIn('slow');
    $('#loadingOutside').center();
    $('#loadingOutside').fadeIn('slow');
    $('#container').css('filter','blur(10px)');
    $('#words').css('filter','blur(10px)');
    $('#meMyself').css('filter','blur(10px)');
};

const hideLoading = () => {
    $('#container').css('filter','blur(00px)');
    $('#words').css('filter','blur(00px)');
    $('#meMyself').css('filter','blur(00px)');
    $('#blurer').fadeOut('slow');
    $('#loadingOutside').fadeOut('slow');
};

let initApp = () => {
    checkScreen();
    $('#container').css("margin-top", Math.max(0, (($(window).height() - $('#container').outerHeight()) / 2) +  $(window).scrollTop()) + "px");
    $('#clickToChooseFile').click( () => {
        $('#pdfPicker').trigger('click');
    });
    $('#pdfPicker').change( () => {
        showLoading();
        processPDF();
        setTimeout(()=>{
            hideLoading();
            $('#container').animate({
                marginTop: '50px'
            },1500);

            $('#words').fadeIn('slow');
        },5000);
        
    });
    $('#moveUp').click( () => {
        $('html,body').animate({
            scrollTop: 0
        },500);
    });
    $(document).scroll( () => {
        let y = $(this).scrollTop();
        if( y > 500){
            $('#moveUp').fadeIn();
        }else{
            $('#moveUp').fadeOut();
        }
    });
    $('#meMyself').hover( () => {
        $('#meMyself').html('See more');
    });
    $('#meMyself').mouseleave( () => {
        $('#meMyself').html('');
    });
    $('#copyAll').click( () =>{
        $('#copyAll').html("Copied!");
        setTimeout( () => {
            $('#copyAll').html("Copy all");
        },2000);
        let contentToCopy = $('#content').html().replace(/<h4>/g,'');
        contentToCopy = contentToCopy.replace(/<\/h4>/g,'\n');
        contentToCopy = contentToCopy.replace(/<b>|<\/b>/g,'');
        contentToCopy = contentToCopy.replace(/<br>/g,'\n');
        let textArea = document.createElement("textarea");
        textArea.value = contentToCopy;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        $('html,body').animate({
            scrollTop: 0
        },500);
        
    });
};
const checkScreen = () => {
    if($(document).width()<1000){
        $('#container').css("width","80%");
        $('#words').css("width","80%");
    }
};
$(document).ready( () => {
    initApp();
});

const processPDF = () => {
    PDFJS.workerSrc = 'js/pdf.worker.js';
    let fileReader = new FileReader();
    fileReader.onload = function() {
        let typedarray = new Uint8Array(this.result);
        let pagesPromises = [];  
        PDFJS.getDocument(typedarray).then(function(pdf) {
            let pagesTotal = pdf.pdfInfo.numPages;    
            for(let pageNum = 1; pageNum <= pagesTotal; pageNum++){
                pagesPromises.push(getPageText(pageNum, pdf));
            }
            Promise.all(pagesPromises).then( function (pagesText) {
                let wordsArray = [];
                pagesText.forEach ( (pageText, pageNumber) => {
                    let pageWords = pageText.split(/\s*([^0-9a-zA-ZąęśżźćółĘĄŻŹĆÓŁ]|[0-9a-zA-ZąęśżźćółĘĄŻŹĆÓŁ]*)\s*/);
                    pageWords.forEach( (word) =>{
                        if(word !== "" && word !== " "){
                            let wordLowerCase = word.toLowerCase();
                            let wordInArray = wordsArray.find(x => x.text === wordLowerCase);
                            if(wordInArray){
                                if(!wordInArray.pages.includes(pageNumber+1)){
                                    wordInArray.pages.push(pageNumber+1);
                                }
                            }else{
                                wordsArray.push({text: wordLowerCase, pages: [pageNumber+1]});
                            }
                        }
                    });
                    wordsArray.sort(function(a,b) {return (a.text > b.text) ? 1 : ((b.text > a.text) ? -1 : 0);} );
                    let wordsDiv = $('#words');
                    let content = $('#content');
                    content.html('');
                    let firstLetter = "";
                    wordsArray.forEach( (word) => {
                        let newRecord = "";
                        if(firstLetter!==word.text.charAt(0).toUpperCase()){
                            firstLetter=word.text.charAt(0).toUpperCase();
                            newRecord+=`<h4><b>${firstLetter}</b></h4>`;
                        }
                        newRecord+=word.text+": ";
                        word.pages.forEach( (page) =>{
                           newRecord+=page+", ";
                        });
                        newRecord = newRecord.substring(0,newRecord.length-2);
                        newRecord+="<br>";
                        content.append(newRecord);
                    });
                    
                });
            });
        });
    };
    fileReader.readAsArrayBuffer(document.getElementById('pdfPicker').files[0]);
};

const getPageText = (pageNum, PDFDocumentInstance) => {
    return new Promise(function (resolve, reject) {
        PDFDocumentInstance.getPage(pageNum).then(function (pdfPage) {
            pdfPage.getTextContent().then(function (textContent) {
                let textItems = textContent.items;
                let finalString = "";
                for (var i = 0; i < textItems.length; i++) {
                    var item = textItems[i];
                    finalString += item.str + " ";
                }
                resolve(finalString);
            });
        });
    });
};

const printWords = () => {
    
};