let cleiton = []; // Variável global para armazenar os dados
let filtro = 'todos'; // Variável global para o filtro

async function dashboard() {
    const apiKey = 'AIzaSyDPczADNpxiAQhW2IuqBJOkNyMM0RbiQ18';
    const spreadsheetId = '1oh9ABtUGS9YBzZ698bc93DKlsKkJ142CjhcULfv9z6c';
    const range = 'A:F';

    async function fetchSpreadsheetData() {
        const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`);
        const data = await response.json();

        if (data.values) {
            cleiton = data.values.slice(1).map(row => ({
                unidade: row[0],           // Unidade
                turma: row[1],             // Turma
                matricula: row[2],         // Matrícula
                nomeAluno: row[3],         // Nome do Aluno
                nomeProcedimento: row[4],  // Nome do Procedimento
                situacao: row[5]           // Situação
            }));
            console.log(cleiton); // Verifica se os dados estão corretos
        } else {
            console.error('Nenhum dado encontrado na planilha.');
        }
    }

    await fetchSpreadsheetData();

    const unidades = [...new Set(cleiton.map(item => item.unidade))]; // Obtém unidades únicas

    const contagemPorUnidade = {};
    unidades.forEach(unidade => {
        contagemPorUnidade[unidade] = {
            Entregue: 0,
            Indefinido: 0,
            alunos: [] // Array para armazenar alunos por unidade
        };
    });

    cleiton.forEach(element => {
        const unidade = element.unidade;

        if (element.nomeProcedimento === 'Assinatura do contrato') {
            if (element.situacao === 'Entregue') {
                contagemPorUnidade[unidade].Entregue++;
                contagemPorUnidade[unidade].alunos.push({ nome: element.nomeAluno, turma: element.turma, situacao: 'Entregue' });
            } else if (
                element.situacao === 'Indefinido' ||
                element.situacao === 'Aguardando' ||
                element.situacao === 'Dispensado'
            ) {
                contagemPorUnidade[unidade].Indefinido++;
                contagemPorUnidade[unidade].alunos.push({ nome: element.nomeAluno, turma: element.turma, situacao: element.situacao });
            }
        }
    });

    const dropdown = document.getElementById('dropdown');
    unidades.forEach(unidade => {
        const item = document.createElement('div');
        item.innerText = unidade;
        item.onclick = () => {
            exibirResultado(unidade, contagemPorUnidade[unidade]);
            dropdown.style.display = 'none'; // Fecha o dropdown após seleção
            selectButton.innerText = unidade; // Atualiza o botão com a unidade selecionada
        };
        dropdown.appendChild(item);
    });

    const selectButton = document.getElementById('select-button');
    selectButton.onclick = () => {
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block'; // Alterna a visibilidade do dropdown
    };

    // Fecha o dropdown se clicar fora dele
    window.onclick = function(event) {
        if (!event.target.matches('#select-button')) {
            dropdown.style.display = 'none';
        }
    };
}

function exibirResultado(unidade, contagem) {
    const resultadoDiv = document.getElementById('resultado');
    resultadoDiv.innerHTML = `
        <h2>${unidade}</h2>
        <p>Entregue: ${contagem.Entregue} alunos</p>
        <p>Não Entregue: ${contagem.Indefinido} alunos</p>
        <button id="filtro-entregue">Mostrar Entregues</button>
        <button id="filtro-nao-entregue">Mostrar Não Entregues</button>
        <button id="filtro-todos">Mostrar Todos</button>
        <button id="baixar-csv">Baixar CSV</button>
        <div class="alunos-scroll">
            <table class="alunos-table">
                <thead>
                    <tr>
                        <th>Nome do Aluno</th>
                        <th>Turma</th>
                        <th>Situação</th>
                    </tr>
                </thead>
                <tbody id="alunos-body"></tbody>
            </table>
        </div>
    `;

    const alunosBody = document.getElementById('alunos-body');
    atualizarTabela(alunosBody, contagem.alunos);

    // Configurando os botões de filtro
    document.getElementById('filtro-entregue').onclick = () => {
        filtro = 'entregue';
        atualizarTabela(alunosBody, contagem.alunos);
    };
    document.getElementById('filtro-nao-entregue').onclick = () => {
        filtro = 'indefinido'; // Para o botão
        atualizarTabela(alunosBody, contagem.alunos); // Mantém as situações
    };
    document.getElementById('filtro-todos').onclick = () => {
        filtro = 'todos';
        atualizarTabela(alunosBody, contagem.alunos);
    };
    document.getElementById('baixar-csv').onclick = () => {
        baixarCSV(contagem.alunos);
    };
}

function atualizarTabela(alunosBody, alunos) {
    alunosBody.innerHTML = ''; // Limpa a tabela antes de preencher novamente

    const alunosFiltrados = alunos.filter(aluno => {
        if (filtro === 'entregue') {
            return aluno.situacao === 'Entregue';
        } else if (filtro === 'indefinido') {
            return aluno.situacao === 'Indefinido' || aluno.situacao === 'Aguardando' || aluno.situacao === 'Dispensado';
        }
        return true; // Todos
    });

    alunosFiltrados.forEach(aluno => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${aluno.nome}</td>
            <td>${aluno.turma}</td>
            <td>${aluno.situacao}</td>
        `;
        alunosBody.appendChild(row);
    });
}

function baixarCSV(alunos) {
    const csvContent = "data:text/csv;charset=utf-8,"
        + "Nome do Aluno,Turma,Situação\n"
        + alunos.map(aluno => `${aluno.nome},${aluno.turma},${aluno.situacao}`).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "alunos.csv");
    document.body.appendChild(link); 

    link.click(); 
    document.body.removeChild(link);
}

dashboard();
