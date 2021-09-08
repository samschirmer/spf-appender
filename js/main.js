document.addEventListener('DOMContentLoaded',function(){ });

const buttons = new Map([
    ['showDomainField', document.getElementById('show-domain-field')],
    ['generateSpf', document.getElementById('generate-spf')],
    ['pollDomain', document.getElementById('poll-domain')],
    ['doAppend', document.getElementById('do-append')],
]);
const fields = new Map([
    ['enterDomain', document.getElementById('enter-domain-field')],
    ['enterSpf', document.getElementById('enter-spf-field')],
]);
const inputs = new Map([
    ['enterDomain', document.getElementById('enter-domain-input')],
    ['enterSpf', document.getElementById('enter-spf-input')],
    ['string', document.getElementById('string-input')],
    ['workingSpf', document.getElementById('working-spf')],
]);

buttons.get('showDomainField').addEventListener('click', () => showDomainField());
buttons.get('generateSpf').addEventListener('click', () => generateSpf());
buttons.get('pollDomain').addEventListener('click', () => pollDomain());
buttons.get('doAppend').addEventListener('click', () => parseFields());

inputs.get('enterSpf').addEventListener('input', () => updateSpfFromManualInput());

const showDomainField = () => {
    const buttonTexts = ['Enter SPF Manually','Pull from my domain'];

    const currBtn = document.getElementById('show-domain-field');
    const i = buttonTexts.findIndex(e => e === currBtn.innerText);
    currBtn.innerText = i > 0 ? buttonTexts[0] : buttonTexts[1];

    fields.get('enterDomain').classList.toggle('hidden');
    fields.get('enterSpf').classList.toggle('hidden');
    buttons.get('pollDomain').classList.toggle('hidden');
}

const updateSpfFromManualInput = () => {
    inputs.get('workingSpf').value = inputs.get('enterSpf').value;
}

const generateSpf = () => {
    inputs.get('workingSpf').value = 'v=spf1 a mx ~all';
}

const pollDomain = () => {
    let domain = inputs.get('enterDomain').value;
    if (!domain.includes('.')) {
        alert('Invalid domain. Enter base domain only (e.g. domain.com)'); 
    }
    domain = domain.split('.');
    domain = `${domain[domain.length - 2]}.${domain[domain.length -1]}`;
    
    let existingSpfs = [];
    const req = `https://dns.google/resolve?type=txt&name=${domain}`
    fetch(req, { method:'get'})
    .then(function(res) {
        res.json().then(function (data) {
            data.Answer.forEach(a => {
               console.log(a.data) 
               if (a.data.includes('v=spf1')) {
                   console.log('found an spf')
                   existingSpfs.push(a.data);
               }
            });
    
            // todo: handle this
            console.log('num spfs:', existingSpfs.length);
            console.log('first spf:', existingSpfs[0]);

        });
    }).catch(function(err) {
        console.log(err);
    });

}