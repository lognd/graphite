# mainboard_mx bring-up

1. Apply bench 5V0 at J1.1/J1.3, confirm CH0 settles within 200ms.
2. Probe CH1 (3V3 rail) -- must be within regulator dropout margin.
3. Attach sigrok capture per `capture.sigrok-cli` before applying UART traffic.
4. CH5 (VREF) has no tap wired in this revision -- board-identity block
   silkscreen (rev/short-hash) should be read optically, not electrically.
