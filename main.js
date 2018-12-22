function get(data, desc) {
    const arr = desc ? desc.split(".") : [];

    while (arr.length && data) {
        const comp = arr.shift();
        const match = /(.+)\[([0-9]*)\]/.exec(comp);

        // handle arrays
        if ((match && match.length === 3)) {
            const [_, arrName, arrIndex] = match;

            data = data[arrName] === undefined ? undefined : data[arrName][arrIndex];

            continue;
        }

        data = data[comp];
    }

    return data;
}

function loadData() {
    return fetch('./db.json')
        .then(response => response.json());
}

function loadContent() {
    return fetch('./content.html')
        .then(response => response.text());
}

function renderTemplateString(str, data) {
    const vars = str
        .split(/({{|}})/ig)
        .filter((el, index) => el.length && (index % 2 === 0));

    vars.forEach((name) => {
        str = str.replace(`{{${name}}}`, get(data, name));
    });

    return str;
}

function renderNode(element, data) {
    const { textContent, attributes } = element;

    element.textContent = renderTemplateString(textContent, data);

    for (let { name, value } of attributes) {
        element.setAttribute(name, renderTemplateString(value, data));
    }
}

function findComment(rootElem, str) {
    // Fourth argument, which is actually obsolete according to the DOM4 standard, is required in IE 11
    const iterator = document.createNodeIterator(rootElem, NodeFilter.SHOW_COMMENT, () => NodeFilter.FILTER_ACCEPT, false);

    for (let curNode; curNode = iterator.nextNode();) {
        const value = curNode.nodeValue.trim();

        if (value === str) {
            return curNode;
        }
    }

    return null;
}

function setContent(node, comment, value) {
    const commentNode = findComment(node, comment);

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = value;

    commentNode.after(...tempDiv.children);
    commentNode.remove();
}

async function render(slidesContent, data) {
    const { content: templateNode } = document.getElementById('root');

    setContent(templateNode, '__Slides__', slidesContent);

    // Setup templates
    const templates = [
        ...templateNode.querySelectorAll('[data-tmpl]'),
        document.querySelector('title'),
    ];
    for (const element of templates) {
        renderNode(element, data);
    }

    // Setup slides
    for (const slide of templateNode.children) {
        if (slide.tagName.toLowerCase() !== 'section') {
            continue;
        }

        slide.classList.add('slide');
    }

    return templateNode;
}

(async () => {
    try {
        const data = await loadData();
        const content = await loadContent();
        const template = await render(content, data);

        document.body.append(template);
    } catch (error) {
        alert('При загрузке презентации произошла ошибка. Мне жаль, правда :-(');

        console.error(error);
    }
})();
