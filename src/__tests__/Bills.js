/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import BillsUI from '../views/BillsUI.js';
import { bills } from '../fixtures/bills.js';
import { ROUTES_PATH } from '../constants/routes.js';
import { localStorageMock } from '../__mocks__/localStorage.js';
import mockStore from '../__mocks__/store.js';
import router from '../app/Router.js';
import Bills from '../containers/Bills.js';

jest.mock('../app/store', () => mockStore);

describe('Given I am connected as an employee', () => {
  describe('When I am on Bills Page', () => {
    beforeEach(() => {
      // Mock du localStorage
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        'user',
        JSON.stringify({
          type: 'Employee',
        })
      );

      // Initialisation du DOM pour le test
      const root = document.createElement('div');
      root.setAttribute('id', 'root');
      document.body.append(root);

      // Initialisation du routeur
      router();
      window.onNavigate(ROUTES_PATH.Bills);
    });

    // Nettoyage après chaque test pour éviter les effets secondaires
    afterEach(() => {
      document.body.innerHTML = '';
    });
    test('Then bill icon in vertical layout should be highlighted', async () => {
      await waitFor(() => screen.getByTestId('icon-window'));
      const windowIcon = screen.getByTestId('icon-window');
      //to-do write expect expression
      expect(windowIcon.classList.contains('active-icon')).toBe(true);
    });
    test('Then bills should be ordered from earliest to latest', async () => {
      await waitFor(() => screen.getByText('Transports'));

      const expectedOrder = ['4 Avr. 04', '3 Mar. 03', '2 Fév. 02', '1 Jan. 01'];
      const dateRegex =
        /(\d{1,2}\s(?:Jan\.|Fév\.|Mar\.|Avr\.|Mai\.|Jui\.|Juil\.|Aoû\.|Sep\.|Oct\.|Nov\.|Déc\.)\s\d{2})/i;
      const actualOrder = screen
        .getAllByText(dateRegex)
        .map((dateElement) => dateElement.innerHTML);
      expect(actualOrder).toEqual(expectedOrder);
    });
  });
  describe('When I navigate to Bills', () => {
    test('Then fetches bills from mock API GET', async () => {
      localStorage.setItem('user', JSON.stringify({ type: 'Employee', email: 'a@a' }));
      const root = document.createElement('div');
      root.setAttribute('id', 'root');
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId('tbody'));
      const allEyeIcons = screen.getAllByTestId('icon-eye');
      const firstEyeIcon = allEyeIcons[0];
      expect(firstEyeIcon).toBeTruthy();
    });
  });
  describe('When an error occurs on API', () => {
    beforeEach(() => {
      jest.spyOn(mockStore, 'bills');
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        'user',
        JSON.stringify({
          type: 'Employee',
          email: 'a@a',
        })
      );
      const root = document.createElement('div');
      root.setAttribute('id', 'root');
      document.body.appendChild(root);
      router();
    });
    test('fetches bills from an API and fails with 404 message error', async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error('Erreur 404'));
          },
        };
      });
      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);
      const message = screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });
    test('fetches messages from an API and fails with 500 message error', async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error('Erreur 500'));
          },
        };
      });

      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);
      const message = screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });
});
describe('Given I am connected as Employee and I am on Bills page', () => {
  describe('When I click on the icon eye', () => {
    test('A modal should open', () => {
      document.body.innerHTML = BillsUI({ data: bills });
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        'user',
        JSON.stringify({
          type: 'Employee',
        })
      );
      $.fn.modal = jest.fn();
      const root = document.createElement('div');
      root.setAttribute('id', 'root');
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);

      const billsContainer = new Bills({
        document,
        onNavigate: () => {},
        store: mockStore,
        localStorage: window.localStorage,
      });

      billsContainer.handleClickIconEye = jest.fn();
      const eyes = screen.getAllByTestId('icon-eye');
      const eye = eyes[0];
      userEvent.click(eye);

      expect(billsContainer.handleClickIconEye).toHaveBeenCalled();

      expect($.fn.modal).toHaveBeenCalledWith('show');

      const modale = screen.getByTestId('modaleFileEmployee');
      expect(modale).toBeTruthy();
    });
  });
});
