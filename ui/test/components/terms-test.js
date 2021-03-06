import expect from 'expect.js';

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';
import fetchMock from 'fetch-mock';
import jsdom from 'mocha-jsdom';

import Terms from '../../src/components/terms';
import { MARPLE_BASE } from 'config';

let component;
let renderedDOM;
let alertMsg = null;

describe('components/terms', function() {

  jsdom();  // create the DOM

  describe('fewer than 50 terms', function() {
    before(function() {
      fetchMock.get(MARPLE_BASE + '/api/terms/foo?segment=1&encoding=utf8&count=51', {
        "termCount": 101,
        "docCount": 19,
        "minTerm": "aardvark",
        "maxTerm": "zebra",
          "terms": [ { term : "aardvark", docFreq: 1, totalTermFreq: 1 } ,
              { term : "bat", docFreq: 1, totalTermFreq: 1 },
              { term : "cat", docFreq: 1, totalTermFreq: 1 } ]
      });

      fetchMock.get(MARPLE_BASE + '/api/terms/foo?segment=1&encoding=int&count=51', {
        "status": 400,
        "body": {
          "code": 400,
          "message": "Field foo cannot be decoded as int"
      }});
    });

    beforeEach(function(done) {
      const indexData = { indexpath: '/some/path' };
      const showAlert = msg => { alertMsg = msg };

      component = TestUtils.renderIntoDocument(
        <Terms segment={1} field={'foo'} indexData={indexData} showAlert={showAlert} />
      );
      setTimeout(() => {
        renderedDOM = ReactDOM.findDOMNode(component);
        done();
      }, 100);    // allow async stuff to happen
    });

  it('renders correctly', function() {
    expect(renderedDOM.children.length).to.eql(3);
    expect(renderedDOM.children[0].tagName).to.eql('TABLE');
    expect(renderedDOM.children[1].tagName).to.eql('FORM');
    expect(renderedDOM.children[2].tagName).to.eql('DIV');

    const tds = renderedDOM.getElementsByTagName('TD');
    expect(tds.length).to.eql(20);
    expect(tds[1].innerHTML).to.eql('101');         // term count
    expect(tds[3].innerHTML).to.eql('19');          // docs with terms
    expect(tds[5].innerHTML).to.eql('aardvark');    // min term
    expect(tds[7].innerHTML).to.eql('zebra');       // max term

      const termTable = renderedDOM.children[2].children[0];
      expect(termTable.tagName).to.eql('TABLE');

    // count the terms
    const rows = termTable.children[1].children;
    expect(rows.length).to.eql(3);
  });

    it('handles invalid encoding', function(done) {
      // find the int dropdown item
      const lis = renderedDOM.children[1].getElementsByTagName('LI');
      expect(lis.length).to.eql(7);
      expect(lis[3].firstChild.innerHTML).to.eql('int');
      TestUtils.Simulate.click(lis[3].firstChild);
      setTimeout(() => {
        expect(alertMsg).to.eql('int is not a valid encoding for this field');
        expect(component.state.encoding).to.eql('utf8');
        done();
      }, 100);
    });

    after(function() {
      fetchMock.restore();
    });
  });

  describe('more than 50 terms', function() {
    before(function() {

        const terms = [ "aa", "ab", "ac", "ad", "ae", "af", "ag", "ah", "ai", "aj",
            "ba", "bb", "bc", "bd", "be", "bf", "bg", "bh", "bi", "bj",
            "ca", "cb", "cc", "cd", "ce", "cf", "cg", "ch", "ci", "cj",
            "da", "db", "dc", "dd", "de", "df", "dg", "dh", "di", "dj",
            "ea", "eb", "ec", "ed", "ee", "ef", "eg", "eh", "ei", "ej",
            "fa" ];
        const termsdata = terms.map((term) => { return { term: term, docFreq: 1, totalTermFreq: 1} });

      fetchMock.get(MARPLE_BASE + '/api/terms/foo?segment=1&encoding=utf8&count=51', {
        "termCount": 101,
        "docCount": 55,
        "minTerm": "aa",
        "maxTerm": "fe",
        "terms": termsdata
      });

      const filteredterms = [ "fa", "fb", "fc", "fd", "fe" ];
      const filtereddata = filteredterms.map((term) => { return { term: term, docFreq: 1, totalTermFreq: 1} });

      fetchMock.get(MARPLE_BASE + '/api/terms/foo?segment=1&encoding=utf8&from=fa&count=51', {
        "termCount": 101,
        "docCount": 55,
        "minTerm": "aa",
        "maxTerm": "fe",
        "terms": filtereddata
      });
    });

    beforeEach(function(done) {
      const indexData = { indexpath: '/some/path' };
      const showAlert = msg => { alertMsg = msg };

      component = TestUtils.renderIntoDocument(
        <Terms segment={1} field={'foo'} indexData={indexData} showAlert={showAlert} />
      );
      setTimeout(() => {
        renderedDOM = ReactDOM.findDOMNode(component);
        done();
      }, 100);    // allow async stuff to happen
    });

    it('renders correctly', function() {
      // count the terms
      const lis = renderedDOM.children[2].getElementsByTagName('DIV');
      expect(lis.length).to.eql(100);

      const buttons = renderedDOM.getElementsByClassName('btn-primary');
      expect(buttons.length).to.eql(1);
      expect(buttons[0].innerHTML).to.eql('Load more');
    });

    it('loads more', function(done) {
      const buttons = renderedDOM.getElementsByClassName('btn-primary');
      TestUtils.Simulate.click(buttons[0]);
      setTimeout(() => {
        const lis = renderedDOM.children[2].getElementsByTagName('DIV');
        expect(lis.length).to.eql(110);
        done();
      }, 100);
    });

    after(function() {
      fetchMock.restore();
    });
  });
});
