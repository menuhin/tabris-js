import {expect, mockTabris, restore, spy, stub} from '../../test';
import ClientStub from '../ClientStub';
import Tab from '../../../src/tabris/widgets/Tab';
import TabFolder from '../../../src/tabris/widgets/TabFolder';
import Composite from '../../../src/tabris/widgets/Composite';

describe('TabFolder', function() {

  let client, tabFolder, parent;

  beforeEach(function() {
    client = new ClientStub();
    mockTabris(client);
    parent = new Composite();
    client.resetCalls();
    tabFolder = new TabFolder().appendTo(parent);
  });

  afterEach(restore);

  it('children list is empty', function() {
    expect(tabFolder.children().toArray()).to.eql([]);
  });

  it('paging is false', function() {
    expect(tabFolder.paging).to.equal(false);
  });

  it('returns initial property values', function() {
    expect(tabFolder.paging).to.equal(false);
  });

  describe('when a Tab is appended', function() {

    let tab, create;

    beforeEach(function() {
      client.resetCalls();
      tab = new Tab({
        title: 'foo',
        image: {src: 'bar'},
        selectedImage: {src: 'selectedBar'},
        badge: '1',
        background: '#010203',
        visible: false
      });
      create = client.calls({op: 'create'})[0];
      tab.appendTo(tabFolder);
    });

    it("sets the tabs's parent", function() {
      let call = client.calls({op: 'set', id: create.id})[0];
      expect(call.properties.parent).to.equal(tabFolder.cid);
    });

    it('getter gets tab properties from cache', function() {
      tab.set({
        title: 'foo',
        badge: 'bar',
        image: 'foobar.jpg',
        selectedImage: 'selectedFoobar.jpg'
      });

      expect(tab.title).to.equal('foo');
      expect(tab.badge).to.equal('bar');
      expect(tab.image).to.eql({src: 'foobar.jpg', width: 'auto', height: 'auto', scale: 'auto'});
      expect(tab.selectedImage).to.eql({src: 'selectedFoobar.jpg', width: 'auto', height: 'auto', scale: 'auto'});
    });

    it('children list contains only the tab', function() {
      expect(tabFolder.children().toArray()).to.eql([tab]);
    });

    it('find list contains only the tab', function() {
      expect(tabFolder.find().toArray()).to.eql([tab]);
    });

    it('parent find list contains only the TabFolder and tab', function() {
      expect(tabFolder.parent().find().toArray()).to.eql([tabFolder, tab]);
    });

    it('parent childrens children list contains only the tab', function() {
      expect(tabFolder.parent().children().children().toArray()).to.eql([tab]);
    });

    it('children can be filtered with id selector', function() {
      let tab2 = new Tab({id: 'foo'}).appendTo(tabFolder);
      expect(tabFolder.children('#foo').toArray()).to.eql([tab2]);
    });

    it('find list can be filtered with id selector', function() {
      let tab2 = new Tab({id: 'foo'}).appendTo(tabFolder);
      expect(tabFolder.parent().find('#foo').toArray()).to.eql([tab2]);
    });

    describe('and the Tab is disposed', function() {

      beforeEach(function() {
        client.resetCalls();
      });

      it('then destroys the tab', function() {
        tab.dispose();

        expect(client.calls({op: 'destroy', id: tab.cid})[0]).to.be.ok;
      });

      it('triggers selectionChanged without selection', function() {
        let listener = spy();

        tabFolder.on({selectionChanged: listener});
        tab.dispose();

        expect(listener).to.have.been.calledOnce;
        expect(listener.firstCall).to.have.been.calledWithMatch({target: tabFolder, value: null});
      });

      it('triggers selectionChanged with selection', function() {
        let tab2 = new Tab({id: 'foo'}).appendTo(tabFolder);
        let listener = spy();

        tabFolder.on({selectionChanged: listener});
        tab.dispose();

        expect(listener).to.have.been.calledOnce;
        expect(listener.firstCall.args[0].target).to.equal(tabFolder);
        expect(listener.firstCall.args[0].value).to.equal(tab2);
      });

      it('selection returns tab when non-last tab disposed', function() {
        let tab2 = new Tab({id: 'foo'}).appendTo(tabFolder);
        stub(client, 'get').returns(tab2.cid);

        tab.dispose();

        expect(tabFolder.selection).to.equal(tab2);
      });

      it('selection returns null independently from client after disposing last tab', function() {
        let tab2 = new Tab();
        stub(client, 'get').returns(tab2.cid);

        tab.dispose();

        expect(tabFolder.selection).to.equal(null);
      });

      it('does not SET selection when last tab disposed', function() {
        tab.dispose();

        expect(client.calls({op: 'set', id: tabFolder.cid}).length).to.equal(0);
      });

      it('SETs selection to the right neighbor', function() {
        let tab2 = new Tab({id: 'foo'}).appendTo(tabFolder);
        let tab3 = new Tab({id: 'foo'}).appendTo(tabFolder);

        tab2.dispose();

        let setCall = client.calls({op: 'set', id: tabFolder.cid})[0];
        expect(setCall.properties.selection).to.equal(tab3.cid);
      });

      it('SETs selection to the left neighbor', function() {
        let tab2 = new Tab({id: 'foo'}).appendTo(tabFolder);

        tab2.dispose();

        let setCall = client.calls({op: 'set', id: tabFolder.cid})[0];
        expect(setCall.properties.selection).to.equal(tab.cid);
      });

      it('does not SET selection to the left neighbor when TabFolder disposed', function() {
        spy(client, 'set');
        new Tab({id: 'foo'}).appendTo(tabFolder);

        tabFolder.dispose();

        expect(client.set).to.have.not.been.called;
      });

    });

    describe('and the TabFolder is disposed', function() {

      beforeEach(function() {
        tabFolder.dispose();
      });

      it('it disposes the Tab', function() {
        expect(tab.isDisposed()).to.equal(true);
      });

    });

  });

  describe('when paging is set', function() {

    beforeEach(function() {
      tabFolder.paging = true;
    });

    it("sets the 'paging' property", function() {
      let setOp = client.calls({id: tabFolder.cid, op: 'create'})[0];
      expect(setOp.properties.paging).to.eql(true);
    });

    it('getter reflects change', function() {
      expect(tabFolder.paging).to.equal(true);
    });

  });

  describe('selection property', function() {

    let tab;

    beforeEach(function() {
      tab = new Tab().appendTo(tabFolder);
    });

    it('Setting a Tab SETs tab id', function() {
      tabFolder.selection = tab;

      let setCall = client.calls({op: 'set', id: tabFolder.cid})[0];
      expect(setCall.properties.selection).to.equal(tab.cid);
    });

    it('Setting a Tab triggers change event', function() {
      let listener = spy();
      tabFolder.onSelectionChanged(listener);

      tabFolder.selection = tab;

      expect(listener).to.have.been.calledOnce;
      expect(listener.firstCall.args[0].target).to.equal(tabFolder);
      expect(listener.firstCall.args[0].value).to.equal(tab);
    });

    it('Setting a Tab does not trigger change event when the tab was already selected', function() {
      let listener = spy();
      tabFolder.onSelectionChanged(listener);

      stub(client, 'get').returns(tab.cid);
      tabFolder.selection = tab;

      expect(listener).not.to.have.been.called;
    });

    it('Ignores setting null with warning', function() {
      stub(console, 'warn');

      tabFolder.selection = null;

      let calls = client.calls({op: 'set', id: tabFolder.cid});
      expect(calls.length).to.equal(0);
      expect(console.warn).to.have.been.calledWith('Can not set TabFolder selection to null');
    });

    it('Ignores setting disposed tab with warning', function() {
      stub(console, 'warn');
      tab.dispose();

      tabFolder.selection = tab;

      let calls = client.calls({op: 'set', id: tabFolder.cid});
      expect(calls.length).to.equal(0);
      expect(console.warn).to.have.been.calledWith('Can not set TabFolder selection to Tab');
    });

    it('Ignores setting non tab', function() {
      stub(console, 'warn');

      tabFolder.selection = 'foo';

      let calls = client.calls({op: 'set', id: tabFolder.cid});
      expect(calls.length).to.equal(0);
      expect(console.warn).to.have.been.calledWith('Can not set TabFolder selection to foo');
    });

    it('Get returns Tab', function() {
      stub(client, 'get').returns(tab.cid);

      expect(tabFolder.selection).to.equal(tab);
    });

    it('Get returns null', function() {
      expect(tabFolder.selection).to.be.null;
    });

    it('supports native event selectionChanged', function() {
      let listener = spy();
      tabFolder.onSelectionChanged(listener);

      tabris._notify(tabFolder.cid, 'select', {selection: tab.cid});

      expect(listener).to.have.been.calledOnce;
      expect(listener.firstCall.args[0].target).to.equal(tabFolder);
      expect(listener.firstCall.args[0].value).to.equal(tab);
    });

    it('supports native event select', function() {
      let listener = spy();
      tabFolder.onSelect(listener);

      tabris._notify(tabFolder.cid, 'select', {selection: tab.cid});

      expect(listener).to.have.been.calledOnce;
      expect(listener.firstCall.args[0].target).to.equal(tabFolder);
      expect(listener.firstCall.args[0].selection).to.equal(tab);
    });

  });

  describe('tabBarLocation property', function() {

    beforeEach(function() {
      client.resetCalls();
    });

    it('does not support change event', function() {
      expect(tabFolder.onTabBarLocationChanged).to.be.undefined;
    });

    it('passes property to client', function() {
      tabFolder = new TabFolder({tabBarLocation: 'top'});

      let properties = client.calls({id: tabFolder.cid, op: 'create'})[0].properties;
      expect(properties.tabBarLocation).to.equal('top');
    });

    it('property is cached', function() {
      spy(client, 'get');
      tabFolder = new TabFolder({tabBarLocation: 'top'});

      let result = tabFolder.tabBarLocation;

      expect(client.get).to.have.not.been.called;
      expect(result).to.equal('top');
    });

    it("sets value tabBarLocation 'top'", function() {
      tabFolder = new TabFolder({tabBarLocation: 'top'});

      let properties = client.calls({id: tabFolder.cid, op: 'create'})[0].properties;
      expect(properties.tabBarLocation).to.eql('top');
    });

    it("sets tabBarLocation 'bottom'", function() {
      tabFolder = new TabFolder({tabBarLocation: 'bottom'});

      let properties = client.calls({id: tabFolder.cid, op: 'create'})[0].properties;
      expect(properties.tabBarLocation).to.eql('bottom');
    });

    it("sets tabBarLocation 'hidden'", function() {
      tabFolder = new TabFolder({tabBarLocation: 'hidden'});

      let properties = client.calls({id: tabFolder.cid, op: 'create'})[0].properties;
      expect(properties.tabBarLocation).to.eql('hidden');
    });

    it("sets tabBarLocation 'auto'", function() {
      tabFolder = new TabFolder({tabBarLocation: 'auto'});

      let properties = client.calls({id: tabFolder.cid, op: 'create'})[0].properties;
      expect(properties.tabBarLocation).to.eql('auto');
    });

  });

  describe('tabMode property', function() {

    beforeEach(function() {
      client.resetCalls();
    });

    it('does not support change event', function() {
      expect(tabFolder.onTabModeChanged).to.be.undefined;
    });

    it('passes property to client', function() {
      tabFolder = new TabFolder({tabMode: 'fixed'});

      let properties = client.calls({id: tabFolder.cid, op: 'create'})[0].properties;
      expect(properties.tabMode).to.equal('fixed');
    });

    it('property is cached', function() {
      spy(client, 'get');
      tabFolder = new TabFolder({tabMode: 'fixed'});

      let result = tabFolder.tabMode;

      expect(client.get).to.have.not.been.called;
      expect(result).to.equal('fixed');
    });

    it("sets value tabMode 'fixed'", function() {
      tabFolder = new TabFolder({tabMode: 'fixed'});

      let properties = client.calls({id: tabFolder.cid, op: 'create'})[0].properties;
      expect(properties.tabMode).to.eql('fixed');
    });

    it("sets tabMode 'scrollable'", function() {
      tabFolder = new TabFolder({tabMode: 'scrollable'});

      let properties = client.calls({id: tabFolder.cid, op: 'create'})[0].properties;
      expect(properties.tabMode).to.eql('scrollable');
    });

  });

  describe('appear event', function() {

    let tab1, tab2, listener;

    beforeEach(function() {
      tab1 = new Tab();
      tab2 = new Tab();
      listener = spy();
      stub(client, 'get').returns(tab1.cid);
    });

    it('is triggered for the first appended tab', function() {
      tab1
        .onAppear(listener)
        .appendTo(tabFolder);

      expect(listener).to.have.been.calledOnce;
      expect(listener.firstCall.args[0].target).to.equal(tab1);
    });

    it('is triggered when the Tab becomes the selection of the TabFolder', function() {
      tab1.appendTo(tabFolder);
      tab2.onAppear(listener).appendTo(tabFolder);

      tabFolder._triggerChangeEvent('selection', tab2);

      expect(listener).to.have.been.calledOnce;
      expect(listener.firstCall.args[0].target).to.equal(tab2);
    });

  });

  describe('disappear event', function() {

    let tab1, tab2, listener;

    beforeEach(function() {
      tab1 = new Tab().appendTo(tabFolder);
      tab2 = new Tab().appendTo(tabFolder);
      listener = spy();
      stub(client, 'get');
    });

    it('is triggered when the Tab is no longer the selection of the TabFolder', function() {
      tab1.onDisappear(listener);

      tabFolder._triggerChangeEvent('selection', tab2);

      expect(listener).to.have.been.calledOnce;
      expect(listener.firstCall.args[0].target).to.equal(tab1);
    });

    it('is not triggered when the Tab appears', function() {
      tab2.onDisappear(listener);

      tabFolder._triggerChangeEvent('selection', tab2);

      expect(listener).not.to.have.been.called;
    });

  });

  describe('scroll event', function() {

    let tab;

    beforeEach(function() {
      tab = new Tab().appendTo(tabFolder);
    });

    it('fires scroll event with tab instance', function() {
      let listener = spy();
      tabFolder.onScroll(listener);

      tabris._notify(tabFolder.cid, 'scroll', {selection: tab.cid, offset: 48});

      checkListen('scroll');
      expect(listener).to.have.been.calledOnce;
      expect(listener.firstCall.args[0].target).to.equal(tabFolder);
      expect(listener.firstCall.args[0].selection).to.equal(tab);
      expect(listener.firstCall.args[0].offset).to.equal(48);
    });

    it('fires scroll event with null selection if tab not found', function() {
      let listener = spy();
      tabFolder.onScroll(listener);

      tabris._notify(tabFolder.cid, 'scroll', {selection: 'not tab', offset: 48});

      checkListen('scroll');
      expect(listener).to.have.been.calledOnce;
      expect(listener.firstCall.args[0].target).to.equal(tabFolder);
      expect(listener.firstCall.args[0].selection).to.equal(null);
      expect(listener.firstCall.args[0].offset).to.equal(48);
    });

  });

  let checkListen = function(event) {
    let listen = client.calls({op: 'listen', id: tabFolder.cid});
    expect(listen.length).to.equal(1);
    expect(listen[0].event).to.equal(event);
    expect(listen[0].listen).to.equal(true);
  };

});
