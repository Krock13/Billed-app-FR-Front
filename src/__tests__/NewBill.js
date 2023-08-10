/**
 * @jest-environment jsdom
 */

// Importation des librairies et dépendances nécessaires
import { screen, waitFor, fireEvent } from '@testing-library/dom';
import '@testing-library/jest-dom/extend-expect';
import userEvent from '@testing-library/user-event';
import { bills } from '../fixtures/bills.js';
import { ROUTES_PATH } from '../constants/routes.js';
import { localStorageMock } from '../__mocks__/localStorage.js';
import mockStore from '../__mocks__/store.js';
import router from '../app/Router.js';
import NewBill from '../containers/NewBill.js';

// Mock du store pour simuler les appels vers celui-ci
jest.mock('../app/store', () => mockStore);

// Début du groupe de tests pour un utilisateur connecté en tant qu'employé
describe('Given I am connected as an employee', () => {
  // Configuration qui s'exécute avant chaque test
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
    window.onNavigate(ROUTES_PATH.NewBill);
  });

  // Nettoyage après chaque test pour éviter les effets secondaires
  afterEach(() => {
    document.body.innerHTML = '';
  });

  // Test de la mise en évidence de l'icône de messagerie
  describe('When I am on NewBill Page', () => {
    test('Then mail icon in vertical layout should be highlighted', async () => {
      // Attendre que l'icône de messagerie soit disponible
      await waitFor(() => screen.getByTestId('icon-mail'));
      const mailIcon = screen.getByTestId('icon-mail');
      expect(mailIcon.classList.contains('active-icon')).toBe(true);
    });
  });

  // Test de la validation de l'extension du fichier soumis
  describe('When I am on the NewBill page and I submit a file with the wrong extension', () => {
    test('Then error message appears and the input value is reset', () => {
      // Initialisation de l'objet NewBill
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      // Espionnage de la méthode de gestion du changement de fichier
      const handleChangeFile = jest.spyOn(newBill, 'handleChangeFile');
      newBill.handleChangeFile = jest.fn();

      const filesInput = screen.getByTestId('file');
      const errorMessage = screen.getByTestId('errorMessage');

      // Création d'un fichier PDF pour le test
      const pdfFile = new File(['document'], 'document.pdf', {
        type: 'application/pdf',
      });

      filesInput.addEventListener('change', handleChangeFile);
      userEvent.upload(filesInput, pdfFile);

      // Vérifications des comportements attendus
      expect(handleChangeFile).toHaveBeenCalled();
      expect(errorMessage).not.toHaveClass('hidden');
      expect(filesInput.value).toBe('');
    });
  });

  // Test du comportement lors de la soumission d'un fichier avec une extension valide
  describe('When I am on the NewBill page and I submit a file with a valid extension', () => {
    test('Then it should call the store to create a bill', async () => {
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      // Espionnage des méthodes du store
      const mockBills = jest.spyOn(mockStore, 'bills');
      const mockCreate = jest.spyOn(mockStore.bills(), 'create');

      // Récupération de l'élément d'entrée du fichier et création d'un fichier d'image jpg pour le test
      const filesInput = screen.getByTestId('file');
      const jpgFile = new File(['image'], 'image.jpg', {
        type: 'image/jpg',
      });

      // Définition de la propriété des fichiers pour l'entrée du fichier
      Object.defineProperty(filesInput, 'files', {
        value: [jpgFile],
        writable: false,
      });

      // Déclenchement de l'événement de changement pour l'entrée du fichier avec la propagation de l'événement
      filesInput.dispatchEvent(new Event('change', { bubbles: true }));

      // Création d'un événement factice pour simuler la sélection du fichier
      const fakeEvent = {
        preventDefault: jest.fn(),
        target: {
          value: 'image.jpg',
          files: [jpgFile],
        },
      };

      // Appel de la méthode handleChangeFile avec l'événement factice
      await newBill.handleChangeFile(fakeEvent);

      // Attente de l'exécution des vérifications pour s'assurer que les méthodes appropriées ont été appelées
      // et que les valeurs attendues sont correctes
      await waitFor(() => {
        expect(mockBills).toHaveBeenCalled();
        expect(mockCreate).toHaveBeenCalled();
        expect(newBill.fileUrl).toBe('https://localhost:3456/images/test.jpg');
        expect(newBill.fileName).toBe('image.jpg');
        expect(newBill.billId).toBe('1234');
      });
    });
  });
});

describe('Given I am connected as an employee', () => {
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
    window.onNavigate(ROUTES_PATH.NewBill);
  });

  describe('When I am on the NewBill page and I submit a valid bill', () => {
    test('Then A new bill is created, I am redirect to Bills page and I see the new Bill', async () => {
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });
      const inputsValue = bills[1];

      // Remplir le formulaire avec des valeurs valides
      userEvent.type(screen.getByTestId('expense-type'), inputsValue.type);
      userEvent.type(screen.getByTestId('expense-name'), inputsValue.name);
      userEvent.type(screen.getByTestId('datepicker'), inputsValue.date);
      userEvent.type(screen.getByTestId('amount'), inputsValue.amount.toString());
      userEvent.type(screen.getByTestId('pct'), inputsValue.pct.toString());
      userEvent.type(screen.getByTestId('commentary'), inputsValue.commentary);

      newBill.fileName = inputsValue.fileName;
      newBill.fileUrl = inputsValue.fileUrl;

      // Espionnage de la méthode de mise à jour de la facture
      newBill.updateBill = jest.fn();
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));

      const form = screen.getByTestId('form-new-bill');
      form.addEventListener('submit', handleSubmit);
      userEvent.click(screen.getByTestId('submit-button'));

      // Vérifications des comportements attendus
      expect(handleSubmit).toHaveBeenCalled();
      expect(newBill.updateBill).toHaveBeenCalled();

      // Vérification de la redirection vers la page bills
      await waitFor(() => {
        expect(screen.getByText('Mes notes de frais')).toBeTruthy();
      });

      // Vérification de l'affichage de la nouvelle facture
      expect(screen.getByText('test1')).toBeTruthy();
    });
  });

  describe('When an error occurs on API', () => {
    test('Then fails with 404 message error', async () => {
      window.onNavigate(ROUTES_PATH.NewBill);
      jest.spyOn(console, 'error').mockImplementation(() => {});
      mockStore.bills.mockImplementationOnce(() => {
        return {
          update: () => {
            return Promise.reject(new Error('Erreur 404'));
          },
        };
      });
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const form = screen.getByTestId('form-new-bill');
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
      form.addEventListener('submit', handleSubmit);
      fireEvent.submit(form);

      await new Promise(process.nextTick);
      expect(console.error).toBeCalled();
      expect(console.error).toBeCalledWith(expect.objectContaining({ message: 'Erreur 404' }));
    });

    test('fetches messages from an API and fails with 500 message error', async () => {
      window.onNavigate(ROUTES_PATH.NewBill);
      jest.spyOn(console, 'error').mockImplementation(() => {});
      mockStore.bills.mockImplementationOnce(() => {
        return {
          update: () => {
            return Promise.reject(new Error('Erreur 500'));
          },
        };
      });
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const form = screen.getByTestId('form-new-bill');
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
      form.addEventListener('submit', handleSubmit);
      fireEvent.submit(form);

      await new Promise(process.nextTick);
      expect(console.error).toBeCalled();
      expect(console.error).toBeCalledWith(expect.objectContaining({ message: 'Erreur 500' }));

      console.error.mockRestore();
      mockStore.bills.mockRestore();
    });
  });
});
