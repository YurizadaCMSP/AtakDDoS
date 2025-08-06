#!/bin/bash
# Script de instalação para o Termux

# Atualizar pacotes
pkg update -y
pkg upgrade -y

# Instalar dependências necessárias
pkg install nodejs -y
pkg install git -y

# Criar diretório para o projeto
mkdir -p ~/stresstest
cd ~/stresstest

# Clonar o projeto (opcional) ou criar arquivos
echo "Criando arquivos do projeto..."

# Instalar dependências Node.js
npm init -y
npm install express socket.io autocannon cors

# Copiar arquivos do projeto
echo "Configuração concluída! Execute 'node app.js' para iniciar o servidor."
