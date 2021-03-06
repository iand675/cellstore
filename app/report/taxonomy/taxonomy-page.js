/*global browser:false, element:false, by:false */
'use strict';

var Concepts = require('./concepts/concepts-page');
var Concept = require('./concept/concept-page');

function Taxonomy(id){
    this.id = id;
    this.concepts = new Concepts(this.id);
    this.elements = element(by.id('presentation-tree')).all(by.css('.angular-ui-tree-node'));
    this.rootElements = element.all(by.repeater('element in presentationTree'));
}

Taxonomy.prototype.visitPage = function(){
    browser.get('/' + this.id);
};

Taxonomy.prototype.getElementName = function(element){
    return element.all(by.binding('element.Name')).get(0);
};

Taxonomy.prototype.removeElement = function(element){
    element.click();
    element.element(by.css('.btn-danger')).click();
    //We wait for the report to save
    browser.waitForAngular();
};

Taxonomy.prototype.getConcept = function(conceptName){
    return new Concept(this.id, conceptName);
};

module.exports = Taxonomy;
