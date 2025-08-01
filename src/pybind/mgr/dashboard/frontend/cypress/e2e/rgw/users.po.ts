import { PageHelper } from '../page-helper.po';

const pages = {
  index: { url: '#/rgw/user', id: 'cd-rgw-user-list' },
  create: { url: '#/rgw/user/create', id: 'cd-rgw-user-form' }
};

export class UsersPageHelper extends PageHelper {
  pages = pages;

  @PageHelper.restrictTo(pages.create.url)
  create(tenant: string, user_id: string, fullname: string, email: string, maxbuckets: string) {
    // Enter in user_id
    cy.get('#user_id').type(user_id);
    // Show Tenant
    cy.get('#show_tenant_input').click({ force: true });
    // Enter in tenant
    cy.get('#tenant').type(tenant);
    // Enter in full name
    cy.get('#display_name').click().type(fullname);

    // Enter in email
    cy.get('#email').click().type(email);

    // Enter max buckets
    this.selectOption('max_buckets_mode', 'Custom');
    cy.get('input#max_buckets').should('exist').should('have.value', '1000');
    cy.get('input#max_buckets').click().clear().type(maxbuckets);

    // Click the create button and wait for user to be made
    cy.contains('button', 'Create User').click();
    this.getFirstTableCell(tenant + '$' + user_id).should('exist');
  }

  @PageHelper.restrictTo(pages.index.url)
  edit(name: string, new_fullname: string, new_email: string, new_maxbuckets: string) {
    this.navigateEdit(name, false, true, null);

    // Change the full name field
    cy.get('input#display_name').click().clear().type(new_fullname);

    // Change the email field
    cy.get('#email').click().clear().type(new_email);

    // Change the max buckets field
    this.selectOption('max_buckets_mode', 'Custom');
    cy.get('input#max_buckets').click().clear().type(new_maxbuckets);

    cy.contains('button', 'Edit User').click();

    // Click the user and check its details table for updated content
    this.getExpandCollapseElement(name).click();
    cy.get('[data-testid="datatable-row-detail"]')
      .should('contain.text', new_fullname)
      .and('contain.text', new_email)
      .and('contain.text', new_maxbuckets);
  }

  invalidCreate() {
    const tenant = '000invalid_tenant';
    const uname = '000invalid_create_user';
    // creating this user in order to check that you can't give two users the same name
    this.navigateTo('create');
    this.create(tenant, uname, 'xxx', 'xxx@xxx', '1');

    this.navigateTo('create');

    // Username
    cy.get('#user_id')
      // No username had been entered. Field should be invalid
      .should('have.class', 'ng-invalid')
      // Try to give user already taken name. Should make field invalid.
      .type(uname);
    cy.get('#show_tenant_input').click({ force: true });
    cy.get('#tenant').type(tenant).should('have.class', 'ng-invalid');
    cy.get('cds-text-label[for=tenant]')
      .find('.invalid-feedback')
      .should('have.text', 'The chosen user ID exists in this tenant.');

    // check that username field is marked invalid if username has been cleared off
    cy.get('#user_id').clear().blur().should('have.class', 'ng-invalid');
    cy.get('cds-text-label[for=user_id]')
      .find('.invalid-feedback')
      .should('have.text', 'This field is required.');

    // Full name
    cy.get('#display_name')
      // No display name has been given so field should be invalid
      .should('have.class', 'ng-invalid')
      // display name field should also be marked invalid if given input then emptied
      .type('a')
      .clear()
      .blur()
      .should('have.class', 'ng-invalid');
    cy.get('cds-text-label[for=display_name]')
      .find('.invalid-feedback')
      .should('have.text', 'This field is required.');

    // put invalid email to make field invalid
    cy.get('#email').type('a').blur().should('have.class', 'ng-invalid');
    cy.get('cds-text-label[for=email]')
      .find('.invalid-feedback')
      .should('have.text', 'This is not a valid email address.');

    // put negative max buckets to make field invalid
    this.expectSelectOption('max_buckets_mode', 'Custom');
    cy.get('input#max_buckets').clear().type('-5').blur();
    cy.get('#max_buckets').should('have.class', 'ng-invalid');
    cy.get('cds-number[for=max_buckets]')
      .find('.invalid-feedback')
      .should('have.text', 'The entered value must be >= 1.');

    this.navigateTo();
    this.delete(tenant + '$' + uname, null, null, true, false, false, true);
  }

  invalidEdit() {
    const tenant = '000invalid_tenant';
    const uname = '000invalid_edit_user';
    // creating this user to edit for the test
    this.navigateTo('create');
    this.create(tenant, uname, 'xxx', 'xxx@xxx', '50');
    const name = tenant + '$' + uname;
    this.navigateEdit(name, false, true, null);

    // put invalid email to make field invalid
    cy.get('#email')
      .clear()
      .type('a')
      .blur()
      .should('not.have.class', 'ng-pending')
      .should('have.class', 'ng-invalid');

    cy.get('cds-text-label[for=email]')
      .find('.invalid-feedback')
      .should('have.text', 'This is not a valid email address.');

    // empty the display name field making it invalid
    cy.get('#display_name').clear({ force: true }).blur().should('have.class', 'ng-invalid');
    cy.get('cds-text-label[for=display_name]')
      .find('.invalid-feedback')
      .should('have.text', 'This field is required.');

    // put negative max buckets to make field invalid
    this.selectOption('max_buckets_mode', 'Disabled');
    cy.get('input#max_buckets').should('not.exist');
    this.selectOption('max_buckets_mode', 'Custom');
    cy.get('input#max_buckets').should('exist').should('have.value', '50');
    cy.get('input#max_buckets').clear().type('-5').blur();
    cy.get('#max_buckets').should('have.class', 'ng-invalid');
    cy.get('cds-number[for=max_buckets]')
      .find('.invalid-feedback')
      .should('have.text', 'The entered value must be >= 1.');

    this.navigateTo();
    this.delete(tenant + '$' + uname, null, null, true, false, false, true);
  }

  checkUserKeys(user_name: string) {
    this.getExpandCollapseElement(user_name).should('be.visible').click();
    cy.get('cd-table').contains('td', user_name).click();
    cy.get('cd-rgw-user-details cd-table [cdstablerow]').first().click();
    cy.get("[aria-label='Show']").should('exist').click({ force: true });
    cy.get('input#user').should('exist');
    cy.get('input#access_key').should('exist');
    cy.get('input#secret_key').should('exist');
    cy.get('cds-modal').should('exist');
  }

  linkAccount(account_id: string, account_name: string, user_id: string, tenant: string) {
    const fullname = 'test_acc_user';
    const selection_name = 'link_account';
    const username = tenant + '$' + user_id;
    // creating this user to edit for this test
    this.create(tenant, user_id, fullname, 'user@test', '1000');
    this.navigateEdit(username);

    cy.get(`select[id=${selection_name}]`).should('exist');
    cy.get(`select[id=${selection_name}]`).select(account_id);
    cy.get(`select[id=${selection_name}] option:checked`).should(
      'have.text',
      `${account_name} - ${tenant}`
    );
    cy.contains('button', 'Edit User').click();

    this.getTableRow(tenant + '$' + user_id).as('AccountUser');
    cy.get('@AccountUser').find('td').eq(3).should('have.text', `${account_name}`);

    // check table details if we have all the details there
    this.getExpandCollapseElement(username).should('be.visible').click();
    // check the Account Details section
    cy.get('legend').should('contain.text', 'Account Details');
    cy.get('table#accountsDetails').scrollIntoView();
    cy.wait(500);
    cy.get('table#accountsDetails').find('tbody tr').should('have.length', 4);
    cy.get('table#accountsDetails').within(() => {
      cy.get('tr')
        .eq(0)
        .within(() => {
          cy.wait(500);
          cy.get('td').eq(0).should('have.text', 'Account ID');
          cy.get('td').eq(1).should('have.text', account_id);
        });
      cy.get('tr')
        .eq(1)
        .within(() => {
          cy.wait(500);
          cy.get('td').eq(0).should('have.text', 'Name');
          cy.get('td').eq(1).should('have.text', account_name);
        });
      cy.get('tr')
        .eq(2)
        .within(() => {
          cy.wait(500);
          cy.get('td').eq(0).should('have.text', 'Tenant');
          cy.get('td').eq(1).should('have.text', tenant);
        });
      cy.get('tr')
        .eq(3)
        .within(() => {
          cy.wait(500);
          cy.get('td').eq(0).should('have.text', 'User type');
          cy.get('td').eq(1).should('have.text', 'rgw user');
        });
    });
  }

  makeRootAccount(account_name: string, user_id: string, tenant: string) {
    const selection_name = 'link_account';
    const username = tenant + '$' + user_id;
    this.navigateEdit(username);
    cy.get(`select[id=${selection_name}]`).should('exist').should('be.disabled');
    cy.get(`select[id=${selection_name}] option:checked`).should(
      'have.text',
      `${account_name} - ${tenant}`
    );
    cy.get('input#account_root_user_input').check({ force: true });

    cy.contains('button', 'Edit User').click();

    // check table details if we have all the details there
    this.getExpandCollapseElement(username).should('be.visible').click();
    // check the Account Details section
    cy.get('legend').should('contain.text', 'Account Details');
    cy.get('table#accountsDetails').scrollIntoView();
    cy.wait(500);
    cy.get('table#accountsDetails').find('tbody tr').should('have.length', 4);
    cy.get('table#accountsDetails').within(() => {
      cy.get('tr')
        .eq(3)
        .within(() => {
          cy.wait(500);
          cy.get('td').eq(0).should('have.text', 'User type');
          cy.get('td').eq(1).should('have.text', 'Account root user');
        });
    });
  }
}
