import React from 'react';
import LegalLayout from './LegalLayout';
import { business } from '../../data/business';

export default function RefundPolicy() {
  const email = <a href={`mailto:${business.email}`}>{business.email}</a>;
  return (
    <LegalLayout
      page="refunds"
      title="Refund & Returns Policy"
      intro={
        <p>
          This policy explains how returns, refunds and re-work are handled for goods we supply and services we carry out. If your written quotation, invoice or service agreement says something different, that document applies. Nothing here affects your rights under Kenyan law, including the Consumer Protection Act, 2012.
        </p>
      }
      sections={[
        {
          id: 'faulty-goods',
          title: 'Faulty or incorrect goods',
          body: (
            <>
              <p>If goods we supplied are faulty, damaged on delivery, or not what you ordered:</p>
              <ul>
                <li>please tell us within 7 days of delivery, with your invoice or delivery note number and photos if possible;</li>
                <li>we'll inspect the item and, if it's faulty or incorrect, repair it, replace it, or refund you, as appropriate;</li>
                <li>we'll cover reasonable costs of collecting or returning faulty or incorrect goods.</li>
              </ul>
              <p>Faults that appear later may be covered by the manufacturer's warranty, which we'll help you claim.</p>
            </>
          ),
        },
        {
          id: 'change-of-mind',
          title: 'Returning goods you no longer need',
          body: (
            <>
              <p>We may accept returns of standard stock items if:</p>
              <ul>
                <li>you ask within 7 days of delivery;</li>
                <li>the item is unused, undamaged and in its original packaging, with proof of purchase.</li>
              </ul>
              <p>Accepted returns are refunded or credited, minus any delivery costs. A restocking fee may apply; we'll tell you the amount before you send the item back.</p>
            </>
          ),
        },
        {
          id: 'non-returnable',
          title: 'Items we can’t take back',
          body: (
            <>
              <p>Unless they are faulty or not as described, we can't accept returns of:</p>
              <ul>
                <li>items made, cut or fabricated to your specification (such as stainless steel fabrication);</li>
                <li>special-order items sourced specifically for you;</li>
                <li>medical consumables and other hygiene-sensitive items once opened;</li>
                <li>items that have been installed or used.</li>
              </ul>
            </>
          ),
        },
        {
          id: 'services',
          title: 'Services and workmanship',
          body: (
            <>
              <p>
                If you're not satisfied with work we've carried out, please tell us within 30 days of completion. If the problem is due to our workmanship, we'll return and put it right at no extra cost. If that isn't possible, we'll agree a fair partial or full refund for the affected work.
              </p>
              <p>
                This doesn't cover problems caused by misuse, normal wear and tear, work by others, or faults in existing equipment or systems that were outside the agreed scope.
              </p>
            </>
          ),
        },
        {
          id: 'deposits',
          title: 'Deposits and cancellations',
          body: (
            <p>
              If you cancel an order or booking, we'll refund any deposit minus costs we've already incurred, such as materials bought for your job, special-order items or work already done. We'll show you these costs.
            </p>
          ),
        },
        {
          id: 'how-refunds',
          title: 'How refunds are paid',
          body: <p>Approved refunds are paid by the method you used to pay (for example, M-Pesa or bank transfer) within 14 days of approval, unless we agree otherwise with you.</p>,
        },
        {
          id: 'contact',
          title: 'How to make a request',
          body: (
            <p>
              Email {email} or call <a href={business.phoneHref}>{business.phone}</a> ({business.hours}). Please include your name, invoice or quotation number, and a short description of the issue.
            </p>
          ),
        },
      ]}
    />
  );
}
