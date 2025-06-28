#!/bin/bash
cd /home/kavia/workspace/code-generation/tictactoe-playmate-115235-224ec5fe/tic_tac_toe_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

