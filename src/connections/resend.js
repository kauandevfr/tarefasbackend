const fs = require('fs')
const path = require('path')
const Handlebars = require('handlebars')

const compileEmail = (templateName, variables) => {
    const source = fs.readFileSync(path.resolve(`src/templates/${templateName}.html`), 'utf-8')
    const template = Handlebars.compile(source)
    return template(variables)
}

module.exports = { compileEmail }