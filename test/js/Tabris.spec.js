/**
 * Copyright (c) 2014 EclipseSource.
 * All rights reserved.
 */

describe("tabris", function() {

  var nativeBridge;
  var log;

  beforeEach(function() {
    nativeBridge = new NativeBridgeSpy();
    log = [];
    tabris._reset();
    tabris._start(nativeBridge);
  });

  describe("when used as a function", function() {

    it("returns a proxy for the given id", function() {
      var result = tabris("foo");

      expect(result).toEqual(jasmine.any(tabris.Proxy));
      expect(result.id).toBe("foo");
    });

    it("returns same proxy instance for the same id", function() {
      var result1 = tabris("foo");
      var result2 = tabris("foo");

      expect(result1).toBe(result2);
    });

    it("does not call create on native bridge", function() {
      tabris("foo");

      expect(nativeBridge.calls().length).toBe(0);
    });

  });

  describe("_start", function() {

    it("can be called without a context", function() {
      tabris._start.call(null, nativeBridge);
    });

    it("executes all load functions", function() {
      tabris.load(function() {
        log.push("foo");
      });
      tabris.load(function() {
        log.push("bar");
      });

      tabris._start.call(null);

      expect(log).toEqual(["foo", "bar"]);
    });

    it("load functions can access tabris functions", function() {
      tabris.load(function() {
        tabris.create("Foo");
      });

      tabris._start.call(null, nativeBridge);

      expect(nativeBridge.calls({op: "create", type: "rwt.widgets.Foo"}).length).toBe(1);
    });

  });

  describe("_notify", function() {

    var label;

    beforeEach(function() {
      label = tabris.create("Label", {});
      spyOn(label, "trigger");
    });

    it("notifies widget proxy", function() {
      tabris._notify(label.id, "foo", {bar: 23});

      expect(label.trigger).toHaveBeenCalledWith("foo", {bar: 23});
    });

    it("notifies widget proxy with translated event name", function() {
      tabris._notify.call(window, label.id, "FocusIn", {});

      expect(label.trigger).toHaveBeenCalledWith("focusin", {});
    });

    it("notifies widget proxy with touchstart event object", function() {
      tabris._notify(label.id, "MouseDown", {x:12, y:34});

      expect(label.trigger).toHaveBeenCalledWith("touchstart", {touches: [{x: 12, y: 34}]});
    });

    it("notifies widget proxy with touchmove event object", function() {
      tabris._notify(label.id, "MouseMove", {x:12, y:34});

      expect(label.trigger).toHaveBeenCalledWith("touchmove", {touches: [{x: 12, y: 34}]});
    });

    it("notifies widget proxy with touchend event object", function() {
      tabris._notify(label.id, "MouseUp", {x:12, y:34});

      expect(label.trigger).toHaveBeenCalledWith("touchend", {touches: [{x: 12, y: 34}]});
    });

    it("notifies widget proxy with longpress event object", function() {
      tabris._notify(label.id, "MenuDetect", {x: 12, y: 34});

      expect(label.trigger).toHaveBeenCalledWith("longpress", {touches: [{x: 12, y: 34}]});
    });

    it("silently ignores events for non-existing ids (does not crash)", function() {
      tabris._notify("no-id", "foo", [23, 42]);
    });

    it("can be called without a context", function() {
      tabris._notify.call("no-id", "foo", [23, 42]);
    });

  });

  describe("load", function() {

    it("function is executed at start time", function() {
      var fn = jasmine.createSpy();

      tabris.load(fn);
      tabris._start(nativeBridge);

      expect(fn).toHaveBeenCalled();
    });

    it("nested load functions are executed at the end", function() {
      var log = [];

      tabris.load(function() {
        log.push("1");
        tabris.load(function() {
          log.push("1a");
        });
        tabris.load(function() {
          log.push("1b");
        });
      });
      tabris.load(function() {
        log.push("2");
      });
      tabris._start(nativeBridge);

      expect(log).toEqual(["1", "2", "1a", "1b"]);
    });

  });

  describe("create", function() {

    it("fails if tabris.js not yet started", function() {
      delete tabris._nativeBridge;

      expect(function() {
        tabris.create("foo.bar", {});
      }).toThrowError("tabris.js not started");
    });

    it("creates a non-empty widget id", function() {
      var proxy = tabris.create("type", {});

      expect(typeof proxy.id).toBe("string");
      expect(proxy.id.length).toBeGreaterThan(0);
    });

    it("creates different widget ids for subsequent calls", function() {
      var proxy1 = tabris.create("type", {});
      var proxy2 = tabris.create("type", {});

      expect(proxy1.id).not.toEqual(proxy2.id);
    });

    it("returns a proxy object", function() {
      var result = tabris.create("type", {});

      expect(result).toEqual(jasmine.any(tabris.Proxy));
    });

    it("triggers a create operation with type and properties", function() {
      var proxy = tabris.create("foo.bar", {foo: 23});

      var createCall = nativeBridge.calls({op: "create", id: proxy.id})[0];

      expect(createCall.type).toBe("foo.bar");
      expect(createCall.properties.foo).toBe(23);
    });

    it("executes type translations", function() {
      var proxy = tabris.create("CheckBox", {});

      var createCall = nativeBridge.calls({op: "create", id: proxy.id})[0];

      expect(createCall.type).toBe("rwt.widgets.Button");
    });

  });

  describe("register types", function() {
    it("allows to register a new type", function() {
      var members = {foo: 23};
      tabris.registerType("CustomType", members);
      var instance = tabris.create("CustomType");
      expect(instance).toEqual(jasmine.any(tabris.Proxy));
      expect(instance).toEqual(jasmine.any(tabris.CustomType));
      delete tabris.CustomType;
    });

    it("adds members to new type", function() {
      var members = {foo: 23};
      tabris.registerType("CustomType", members);
      var instance = tabris.create("CustomType");
      expect(instance.foo).toBe(23);
      expect(instance.type).toBe("CustomType");
      delete tabris.CustomType;
    });

    it("calls 'create' with type", function() {
      tabris.registerType("CustomType", {});
      tabris.create("CustomType");

      expect(nativeBridge.calls({op: "create"})[0].type).toBe("rwt.widgets.CustomType");
      delete tabris.CustomType;
    });

    it("calls 'create' with _type if present", function() {
      tabris.registerType("CustomType", {_type: "foo.Type"});
      tabris.create("CustomType");

      expect(nativeBridge.calls({op: "create"})[0].type).toBe("foo.Type");
      delete tabris.CustomType;
    });

    it("prevents to overwrite already registered types", function() {
      expect(function() {
        tabris.registerType("Button", {});
      }).toThrowError("Type already registered: Button");
    });
  });

});
