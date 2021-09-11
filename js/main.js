document.addEventListener('DOMContentLoaded',function(){
    const urlSearchParams = new URLSearchParams(window.location.search);
    const params = Object.fromEntries(urlSearchParams.entries());
    if (params['s']) { document.getElementById('string-input').value = params['s']; }
 });

const buttons = new Map([
    ['closeDomainModal', document.getElementById('close-domain-modal')],
    ['showDomainModal', document.getElementById('show-domain-modal')],
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
    ['destination', document.getElementById('destination')],
]);

buttons.get('closeDomainModal').addEventListener('click', () => toggleDomainModal());
buttons.get('showDomainModal').addEventListener('click', () => toggleDomainModal());
buttons.get('generateSpf').addEventListener('click', () => generateSpf());
buttons.get('pollDomain').addEventListener('click', () => pollDomain());
buttons.get('doAppend').addEventListener('click', () => parseFields());
inputs.get('destination').addEventListener('click', () => copyNewSpf());
inputs.get('enterSpf').addEventListener('input', () => updateSpfFromManualInput());
inputs.get('string').addEventListener('input', () => unlockSubmission());

const showDomainField = () => {
    const buttonTexts = ['Enter SPF Manually','Pull from my domain'];

    const currBtn = document.getElementById('show-domain-field');
    const i = buttonTexts.findIndex(e => e === currBtn.innerText);
    currBtn.innerText = i > 0 ? buttonTexts[0] : buttonTexts[1];

    fields.get('enterDomain').classList.toggle('hidden');
    fields.get('enterSpf').classList.toggle('hidden');
    buttons.get('pollDomain').classList.toggle('hidden');
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
            if (!data || !data.Answer || data.Answer.length === 0) {
                generateSpf();
                toggleDomainModal();
                return;
            }

            data.Answer.forEach(a => {
                if (detectSpf(a.data)) { existingSpfs.push(a.data); }
            });
    
            if (existingSpfs.length === 1) {
                inputs.get('workingSpf').value = existingSpfs[0];
            } else if (existingSpfs === 0) {
                generateSpf();
            } else {
                inputs.get('workingSpf').value = mergeSpfs(existingSpfs);
            }
            toggleDomainModal();
        });
    }).catch(function(err) {
        console.log(err);
    });
}

const detectSpf = (str) => {
    return str.includes('v=spf1');
}

const toggleDomainModal = () => {
    document.getElementById('domain-overlay').classList.toggle('hidden');
}

const updateSpfFromManualInput = () => {
    inputs.get('workingSpf').value = inputs.get('enterSpf').value;
}

const generateSpf = () => {
    inputs.get('workingSpf').value = 'v=spf1 a mx ~all';
}

const unique = (value, index, self) => {
  return self.indexOf(value) === index;
}

const mergeSpfs = (spfs) => {
    let segments = [];
    spfs.forEach(spf => {
        segments.push(spf.split(' '));
    });
    segments = segments.filter(unique);
    return segments.join(' ');
}

const parseFields = () => {
    let allIndexes = [];
    let segments = inputs.get('workingSpf').value.split(' ');
    let inclusions = inputs.get('string').value.split(' ').filter(s => s !== '');

    // combining the inclusion(s) with the working spf
    inclusions.forEach(i => {
        segments.splice(segments.length - 1, 0, i.trim());
    });

    // removing duplicate enries and getting indexes any 'all' suffixes in case there's multiple
    segments = segments.filter(unique);
    for (let [i, s] of segments.entries()) {
        if (['-all','?all','~all'].includes(s)) {allIndexes.push(i)}
    };

    // apparently contains multiple suffixes, such as [~all, -all], so just replacing with ~all
    if (allIndexes.length > 1) {
        allIndexes.forEach(i => {
            segments = segments.filter(s => !['-all','~all','?all'].includes(s));
        });
        segments.splice(segments.length, 0, '~all')
    }
    inputs.get('destination').value = segments.join(' ');
    document.getElementById('result').classList.remove('hidden');
}

const copyNewSpf = () => {
    const spf = inputs.get('destination');
    spf.select();
    document.execCommand('copy');
    spf.classList.add('clicked');
    document.getElementById('copied').classList.remove('hidden');
}

const unlockSubmission = () => {
    buttons.get('doAppend').disabled = !inputs.get('string').value.length > 0;
}
