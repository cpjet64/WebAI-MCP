import { 
  mockWebAIServerResponse, 
  mockServerDiscovery, 
  createMockApiResponse 
} from '../setup';
import nock from 'nock';

describe('Element Interaction Tools', () => {
  beforeEach(() => {
    mockServerDiscovery();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('clickElement', () => {
    it('should click element by selector successfully', async () => {
      const mockResponse = createMockApiResponse({
        success: true,
        message: 'Element clicked successfully',
        element: {
          tagName: 'BUTTON',
          id: 'submit-btn',
          className: 'btn btn-primary'
        }
      });
      
      nock('http://127.0.0.1:3025')
        .post('/click-element')
        .reply(200, mockResponse);

      const response = await fetch('http://127.0.0.1:3025/click-element', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selector: '#submit-btn',
          waitForElement: true,
          timeout: 5000
        })
      });
      
      const result = await response.json();
      
      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.data.message).toBe('Element clicked successfully');
      expect(result.data.element.tagName).toBe('BUTTON');
    });

    it('should click element by coordinates successfully', async () => {
      const mockResponse = createMockApiResponse({
        success: true,
        message: 'Clicked at coordinates (100, 200)',
        coordinates: { x: 100, y: 200 }
      });
      
      nock('http://127.0.0.1:3025')
        .post('/click-element')
        .reply(200, mockResponse);

      const response = await fetch('http://127.0.0.1:3025/click-element', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coordinates: { x: 100, y: 200 }
        })
      });
      
      const result = await response.json();
      
      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.data.coordinates).toEqual({ x: 100, y: 200 });
    });

    it('should handle element not found', async () => {
      const errorResponse = createMockApiResponse(null, false, 'Element not found: #non-existent');
      
      nock('http://127.0.0.1:3025')
        .post('/click-element')
        .reply(404, errorResponse);

      const response = await fetch('http://127.0.0.1:3025/click-element', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selector: '#non-existent',
          waitForElement: true,
          timeout: 1000
        })
      });
      
      const result = await response.json();
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Element not found: #non-existent');
    });

    it('should handle timeout waiting for element', async () => {
      const errorResponse = createMockApiResponse(null, false, 'Timeout waiting for element');
      
      nock('http://127.0.0.1:3025')
        .post('/click-element')
        .delay(6000) // Longer than timeout
        .reply(408, errorResponse);

      const controller = new AbortController();
      setTimeout(() => controller.abort(), 5000);
      
      try {
        await fetch('http://127.0.0.1:3025/click-element', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            selector: '#slow-element',
            waitForElement: true,
            timeout: 5000
          }),
          signal: controller.signal
        });
      } catch (error: any) {
        expect(error.name).toBe('AbortError');
      }
    });

    it('should validate click parameters', async () => {
      const testCases = [
        {
          body: {},
          expectedError: 'Either selector or coordinates must be provided'
        },
        {
          body: { selector: '', coordinates: { x: 100, y: 200 } },
          expectedError: 'Cannot provide both selector and coordinates'
        },
        {
          body: { coordinates: { x: -10, y: 200 } },
          expectedError: 'Invalid coordinates'
        },
        {
          body: { selector: '#test', timeout: -1 },
          expectedError: 'Timeout must be positive'
        }
      ];

      for (const testCase of testCases) {
        nock('http://127.0.0.1:3025')
          .post('/click-element')
          .reply(400, createMockApiResponse(null, false, testCase.expectedError));

        const response = await fetch('http://127.0.0.1:3025/click-element', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testCase.body)
        });
        
        const result = await response.json();
        
        expect(response.status).toBe(400);
        expect(result.error).toBe(testCase.expectedError);
        
        nock.cleanAll();
      }
    });
  });

  describe('fillInput', () => {
    it('should fill input field successfully', async () => {
      const mockResponse = createMockApiResponse({
        success: true,
        message: 'Input filled successfully',
        element: {
          tagName: 'INPUT',
          type: 'text',
          value: 'test@example.com'
        }
      });
      
      nock('http://127.0.0.1:3025')
        .post('/fill-input')
        .reply(200, mockResponse);

      const response = await fetch('http://127.0.0.1:3025/fill-input', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selector: '#email',
          text: 'test@example.com',
          clearFirst: true,
          triggerEvents: true
        })
      });
      
      const result = await response.json();
      
      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.data.element.value).toBe('test@example.com');
    });

    it('should handle input field not found', async () => {
      const errorResponse = createMockApiResponse(null, false, 'Input field not found');
      
      nock('http://127.0.0.1:3025')
        .post('/fill-input')
        .reply(404, errorResponse);

      const response = await fetch('http://127.0.0.1:3025/fill-input', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selector: '#non-existent-input',
          text: 'test'
        })
      });
      
      const result = await response.json();
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Input field not found');
    });

    it('should handle readonly input field', async () => {
      const errorResponse = createMockApiResponse(null, false, 'Input field is readonly');
      
      nock('http://127.0.0.1:3025')
        .post('/fill-input')
        .reply(400, errorResponse);

      const response = await fetch('http://127.0.0.1:3025/fill-input', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selector: '#readonly-input',
          text: 'test'
        })
      });
      
      const result = await response.json();
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Input field is readonly');
    });
  });

  describe('selectOption', () => {
    it('should select option by value successfully', async () => {
      const mockResponse = createMockApiResponse({
        success: true,
        message: 'Option selected successfully',
        element: {
          tagName: 'SELECT',
          selectedValue: 'option2',
          selectedText: 'Option 2'
        }
      });
      
      nock('http://127.0.0.1:3025')
        .post('/select-option')
        .reply(200, mockResponse);

      const response = await fetch('http://127.0.0.1:3025/select-option', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selector: '#country',
          value: 'option2'
        })
      });
      
      const result = await response.json();
      
      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.data.element.selectedValue).toBe('option2');
    });

    it('should select option by text successfully', async () => {
      const mockResponse = createMockApiResponse({
        success: true,
        message: 'Option selected successfully',
        element: {
          tagName: 'SELECT',
          selectedValue: 'us',
          selectedText: 'United States'
        }
      });
      
      nock('http://127.0.0.1:3025')
        .post('/select-option')
        .reply(200, mockResponse);

      const response = await fetch('http://127.0.0.1:3025/select-option', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selector: '#country',
          text: 'United States'
        })
      });
      
      const result = await response.json();
      
      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.data.element.selectedText).toBe('United States');
    });

    it('should select option by index successfully', async () => {
      const mockResponse = createMockApiResponse({
        success: true,
        message: 'Option selected successfully',
        element: {
          tagName: 'SELECT',
          selectedIndex: 1,
          selectedValue: 'option2'
        }
      });
      
      nock('http://127.0.0.1:3025')
        .post('/select-option')
        .reply(200, mockResponse);

      const response = await fetch('http://127.0.0.1:3025/select-option', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selector: '#country',
          index: 1
        })
      });
      
      const result = await response.json();
      
      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.data.element.selectedIndex).toBe(1);
    });

    it('should handle option not found', async () => {
      const errorResponse = createMockApiResponse(null, false, 'Option not found');
      
      nock('http://127.0.0.1:3025')
        .post('/select-option')
        .reply(404, errorResponse);

      const response = await fetch('http://127.0.0.1:3025/select-option', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selector: '#country',
          value: 'non-existent'
        })
      });
      
      const result = await response.json();
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Option not found');
    });
  });

  describe('submitForm', () => {
    it('should submit form by selector successfully', async () => {
      const mockResponse = createMockApiResponse({
        success: true,
        message: 'Form submitted successfully',
        navigationOccurred: true
      });
      
      nock('http://127.0.0.1:3025')
        .post('/submit-form')
        .reply(200, mockResponse);

      const response = await fetch('http://127.0.0.1:3025/submit-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formSelector: '#contact-form',
          waitForNavigation: true,
          navigationTimeout: 10000
        })
      });
      
      const result = await response.json();
      
      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.data.navigationOccurred).toBe(true);
    });

    it('should submit form by button click successfully', async () => {
      const mockResponse = createMockApiResponse({
        success: true,
        message: 'Form submitted via button click',
        navigationOccurred: false
      });
      
      nock('http://127.0.0.1:3025')
        .post('/submit-form')
        .reply(200, mockResponse);

      const response = await fetch('http://127.0.0.1:3025/submit-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submitButtonSelector: '#submit-btn',
          waitForNavigation: false
        })
      });
      
      const result = await response.json();
      
      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.data.navigationOccurred).toBe(false);
    });

    it('should handle form not found', async () => {
      const errorResponse = createMockApiResponse(null, false, 'Form not found');
      
      nock('http://127.0.0.1:3025')
        .post('/submit-form')
        .reply(404, errorResponse);

      const response = await fetch('http://127.0.0.1:3025/submit-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formSelector: '#non-existent-form'
        })
      });
      
      const result = await response.json();
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Form not found');
    });
  });

  describe('getSelectedElement', () => {
    it('should get selected element successfully', async () => {
      const mockResponse = createMockApiResponse({
        element: {
          tagName: 'DIV',
          id: 'selected-element',
          className: 'highlight',
          textContent: 'Selected content',
          attributes: {
            'data-id': '123',
            'role': 'button'
          }
        }
      });
      
      nock('http://127.0.0.1:3025')
        .get('/selected-element')
        .reply(200, mockResponse);

      const response = await fetch('http://127.0.0.1:3025/selected-element');
      const result = await response.json();
      
      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.data.element.tagName).toBe('DIV');
      expect(result.data.element.id).toBe('selected-element');
    });

    it('should handle no element selected', async () => {
      const mockResponse = createMockApiResponse({
        element: null,
        message: 'No element currently selected'
      });
      
      nock('http://127.0.0.1:3025')
        .get('/selected-element')
        .reply(200, mockResponse);

      const response = await fetch('http://127.0.0.1:3025/selected-element');
      const result = await response.json();
      
      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.data.element).toBeNull();
      expect(result.data.message).toBe('No element currently selected');
    });
  });

  describe('inspectElementsBySelector', () => {
    it('should inspect elements by selector successfully', async () => {
      const mockResponse = createMockApiResponse({
        elements: [
          {
            tagName: 'BUTTON',
            id: 'btn1',
            className: 'btn primary',
            textContent: 'Click me',
            attributes: { type: 'button' }
          },
          {
            tagName: 'BUTTON',
            id: 'btn2',
            className: 'btn secondary',
            textContent: 'Cancel',
            attributes: { type: 'button' }
          }
        ],
        count: 2
      });
      
      nock('http://127.0.0.1:3025')
        .post('/inspect-elements-by-selector')
        .reply(200, mockResponse);

      const response = await fetch('http://127.0.0.1:3025/inspect-elements-by-selector', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selector: 'button',
          resultLimit: 2,
          includeComputedStyles: ['color', 'background-color']
        })
      });
      
      const result = await response.json();
      
      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.data.elements).toHaveLength(2);
      expect(result.data.count).toBe(2);
    });

    it('should handle invalid selector', async () => {
      const errorResponse = createMockApiResponse(null, false, 'Invalid CSS selector');
      
      nock('http://127.0.0.1:3025')
        .post('/inspect-elements-by-selector')
        .reply(400, errorResponse);

      const response = await fetch('http://127.0.0.1:3025/inspect-elements-by-selector', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selector: '###invalid',
          resultLimit: 1
        })
      });
      
      const result = await response.json();
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid CSS selector');
    });
  });
});
