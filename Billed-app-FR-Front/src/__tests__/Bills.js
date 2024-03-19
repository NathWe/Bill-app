/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import Bills from "../containers/Bills.js";
import mockStore from "../__mocks__/store";

import router from "../app/Router.js";

window.alert = jest.fn()
jest.mock("../app/Store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      //Ajout de la mention expect
      expect(windowIcon.classList.contains("active-icon")).toBe(true);
    });

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    });
  });
});

// Test handleClickIconEye ligne 14 containers/Bills.js
describe("When I click on first eye icon", () => {
  test("Then modal should open", () => {

    Object.defineProperty(window, localStorage, { value: localStorageMock });
    window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));
    const html = BillsUI({ data: bills });
    document.body.innerHTML = html;

    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };

    const billsContainer = new Bills({
      document,
      onNavigate,
      localStorage: localStorageMock,
      store: null,
    });

    //MOCK de la modale
    $.fn.modal = jest.fn();

    //MOCK L'ICÔNE DE CLIC
    const handleClickIconEye = jest.fn(() => {
      billsContainer.handleClickIconEye;
    });
    const firstEyeIcon = screen.getAllByTestId("icon-eye")[0];
    firstEyeIcon.addEventListener("click", handleClickIconEye);
    fireEvent.click(firstEyeIcon);
    expect(handleClickIconEye).toHaveBeenCalled();
    expect($.fn.modal).toHaveBeenCalled();
  });
});

//Test navigation ligne 21 containers/Bills.js
describe("When I click the button 'Nouvelle note de frais'", () => {
  test("Then newbill appears", () => {
    //Intégration du chemin d'accès
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname })
    }
    const billsPage = new Bills({
      document,
      onNavigate,
      store: null,
      bills: bills,
      localStorage: window.localStorage
    })
    //création constante pour la fonction qui appelle la fonction a tester
    const OpenNewBill = jest.fn(billsPage.handleClickNewBill); //ligne 19 containers/Bills.js
    const btnNewBill = screen.getByTestId("btn-new-bill")//cible le btn nouvelle note de frais
    btnNewBill.addEventListener("click", OpenNewBill)
    fireEvent.click(btnNewBill)//simule évènement au click
    // on vérifie que la fonction est appelée et que la page souhaitée s'affiche
    expect(OpenNewBill).toHaveBeenCalled()//je m'attends à ce que la page nouvelle note de frais se charge
    expect(screen.getByText("Envoyer une note de frais")).toBeTruthy()//la nouvelle note de frais apparait avec le titre envoyer une note de frais
  })
})

// test d'integration get bill
describe("When I get bills", () => {
  //Quand je demande de récupérer des factures
  test("Then it should render bills", async () => {
    //Ensuite, il devrait afficher les factures
    const bills = new Bills({
      //récupération des factures dans le store
      document,
      onNavigate,
      store: mockStore,
      localStorage: window.localStorage,
    });
    const getBills = jest.fn(() => bills.getBills()); //simulation du click       
    const value = await getBills(); //vérification
    expect(getBills).toHaveBeenCalled(); //on vérifie que la méthode est appelée
    expect(value.length).toBe(4); //test si la longueur du tableau est a 4 du store.js
  });
});

//Test erreurs 404 et 500
describe("When an error occurs on API", () => { //Lorsqu'une erreur se produit sur l'API
  beforeEach(() => {
    jest.spyOn(mockStore, 'bills')
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
    })
    window.localStorage.setItem(
      'user',
      JSON.stringify({
        type: 'Employee',
        email: 'a@a',
      })
    )
    const root = document.createElement('div')
    root.setAttribute('id', 'root')
    document.body.appendChild(root)
    router()
  })

  test("Then i fetch the invoices in the api and it fails with a 404 error", async () => {//Ensuite, je récupère les factures dans l'api et cela échoue avec une erreur 404
    mockStore.bills.mockImplementationOnce(() => {//changement du comportement pour générer une erreur
      return {
        list: () => {
          return Promise.reject(new Error("Erreur 404"))
        }
      }
    })
    window.onNavigate(ROUTES_PATH.Bills)
    await new Promise(process.nextTick)
    const message = screen.getByText(/Erreur 404/)
    expect(message).toBeTruthy()
  })

  test("Then i fetch the invoices in the api and it fails with a 500 error", async () => {//Ensuite, je récupère les factures dans l'api et cela échoue avec une erreur 500
    mockStore.bills.mockImplementationOnce(() => {
      return {
        list: () => {
          return Promise.reject(new Error("Erreur 500"))
        }
      }
    })
    window.onNavigate(ROUTES_PATH.Bills)
    await new Promise(process.nextTick)
    const message = screen.getByText(/Erreur 500/)
    expect(message).toBeTruthy()
  })
});