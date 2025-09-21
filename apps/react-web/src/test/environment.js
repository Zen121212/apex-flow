const { JSDOM } = require('jsdom');
const { TestEnvironment } = require('jest-environment-jsdom');

class CustomJSDOMEnvironment extends TestEnvironment {
  constructor(config, context) {
    const customConfig = {
      ...config,
      testEnvironmentOptions: {
        ...config.testEnvironmentOptions,
        resources: 'usable',
        runScripts: 'dangerously',
        pretendToBeVisual: true,
        beforeParse: function(window) {
          // Disable canvas completely
          delete window.HTMLCanvasElement;
          delete window.CanvasRenderingContext2D;
          
          // Mock minimal canvas functionality if needed
          window.HTMLCanvasElement = function() {
            return {
              getContext: () => ({}),
              toDataURL: () => 'data:image/png;base64,mock'
            };
          };
        }
      }
    };
    
    super(customConfig, context);
  }
  
  async setup() {
    await super.setup();
    
    // Additional canvas mocking in global scope
    this.global.HTMLCanvasElement = function() {
      return {
        getContext: () => ({}),
        toDataURL: () => 'data:image/png;base64,mock',
        width: 0,
        height: 0
      };
    };
  }
}

module.exports = CustomJSDOMEnvironment;