#!/usr/bin/env node

// Script para analisar warnings e erros do código usando ESLint e TypeScript
const fs = require('fs');
const path = require('path');

// Função para ler e analisar o relatório do ESLint
function analyzeESLintReport() {
  try {
    const reportPath = path.join(__dirname, 'eslint-report.json');
    if (!fs.existsSync(reportPath)) {
      console.log('❌ Relatório do ESLint não encontrado. Execute: npm run lint:report');
      return;
    }

    const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    
    console.log('\n📊 ANÁLISE DE CÓDIGO - RELATÓRIO DETALHADO\n');
    console.log('=' .repeat(60));
    
    let totalErrors = 0;
    let totalWarnings = 0;
    let totalFixable = 0;
    
    const problemsByFile = [];
    
    reportData.forEach(file => {
      if (file.messages.length > 0) {
        totalErrors += file.errorCount;
        totalWarnings += file.warningCount;
        totalFixable += file.fixableErrorCount + file.fixableWarningCount;
        
        problemsByFile.push({
          filePath: file.filePath.replace(__dirname, '.'),
          errorCount: file.errorCount,
          warningCount: file.warningCount,
          fixableCount: file.fixableErrorCount + file.fixableWarningCount,
          messages: file.messages
        });
      }
    });
    
    // Resumo geral
    console.log('📈 RESUMO GERAL:');
    console.log(`   Total de arquivos analisados: ${reportData.length}`);
    console.log(`   Arquivos com problemas: ${problemsByFile.length}`);
    console.log(`   🔴 Erros: ${totalErrors}`);
    console.log(`   🟡 Warnings: ${totalWarnings}`);
    console.log(`   🔧 Problemas corrigíveis automaticamente: ${totalFixable}`);
    console.log('');
    
    // Detalhes por arquivo
    if (problemsByFile.length > 0) {
      console.log('📁 PROBLEMAS POR ARQUIVO:\n');
      
      problemsByFile.forEach(file => {
        console.log(`📄 ${file.filePath}`);
        console.log(`   Erros: ${file.errorCount} | Warnings: ${file.warningCount} | Corrigíveis: ${file.fixableCount}`);
        console.log('');
        
        file.messages.forEach((message, index) => {
          const severity = message.severity === 2 ? '🔴 ERRO' : '🟡 WARNING';
          const fixable = message.fix ? ' [CORRIGÍVEL]' : '';
          
          console.log(`   ${index + 1}. ${severity}${fixable}`);
          console.log(`      Linha ${message.line}:${message.column} - ${message.message}`);
          console.log(`      Regra: ${message.ruleId}`);
          console.log('');
        });
        
        console.log('-'.repeat(50));
        console.log('');
      });
    }
    
    // Análise de regras mais violadas
    const ruleViolations = {};
    reportData.forEach(file => {
      file.messages.forEach(message => {
        if (message.ruleId) {
          ruleViolations[message.ruleId] = (ruleViolations[message.ruleId] || 0) + 1;
        }
      });
    });
    
    if (Object.keys(ruleViolations).length > 0) {
      console.log('📊 REGRAS MAIS VIOLADAS:\n');
      const sortedRules = Object.entries(ruleViolations)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);
      
      sortedRules.forEach(([rule, count], index) => {
        console.log(`   ${index + 1}. ${rule}: ${count} violação(ões)`);
      });
      console.log('');
    }
    
    // Recomendações
    console.log('💡 RECOMENDAÇÕES:\n');
    
    if (totalFixable > 0) {
      console.log(`   🔧 Execute 'npm run lint:fix' para corrigir automaticamente ${totalFixable} problema(s)`);
    }
    
    if (ruleViolations['@typescript-eslint/no-unused-vars']) {
      console.log('   📝 Remova variáveis não utilizadas ou prefixe com underscore (_)');
    }
    
    if (ruleViolations['prefer-const']) {
      console.log('   📝 Use "const" ao invés de "let" para variáveis que não são reatribuídas');
    }
    
    if (ruleViolations['react-hooks/exhaustive-deps']) {
      console.log('   📝 Adicione dependências faltantes nos arrays de dependência dos hooks');
    }
    
    console.log('');
    console.log('=' .repeat(60));
    
    // Status final
    if (totalErrors === 0 && totalWarnings === 0) {
      console.log('✅ PARABÉNS! Nenhum problema encontrado no código!');
    } else if (totalErrors === 0) {
      console.log('⚠️  Código funcional, mas há warnings que devem ser revisados.');
    } else {
      console.log('❌ Há erros que precisam ser corrigidos antes do deploy.');
    }
    
  } catch (error) {
    console.error('❌ Erro ao analisar relatório do ESLint:', error.message);
  }
}

// Função para analisar problemas de TypeScript
function analyzeTypeScriptIssues() {
  console.log('\n🔍 VERIFICAÇÃO DE TIPOS TYPESCRIPT\n');
  console.log('=' .repeat(60));
  
  // Esta função seria expandida para analisar saída do tsc --noEmit
  console.log('💡 Execute "npm run type-check" para verificar erros de tipo.');
  console.log('');
}

// Função principal
function main() {
  console.log('🚀 INICIANDO ANÁLISE DE CÓDIGO...');
  
  analyzeESLintReport();
  analyzeTypeScriptIssues();
  
  console.log('\n📋 PRÓXIMOS PASSOS:');
  console.log('   1. Corrija os erros listados acima');
  console.log('   2. Execute "npm run lint:fix" para correções automáticas');
  console.log('   3. Execute "npm run type-check" para verificar tipos');
  console.log('   4. Execute "npm test" para verificar se os testes passam');
  console.log('   5. Para análise completa com SonarQube: "npm run sonar:analyze"');
  console.log('');
}

if (require.main === module) {
  main();
}

module.exports = { analyzeESLintReport, analyzeTypeScriptIssues };