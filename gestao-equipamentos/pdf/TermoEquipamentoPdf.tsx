import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from '@react-pdf/renderer';
import type { RegistroDevolucao, DocOperation, ParametrosTermo } from '../types/devolucoes';

interface TermoEquipamentoPdfProps {
  registro: RegistroDevolucao;
  docOperation: DocOperation;
  parametros: ParametrosTermo;
  logoUrl?: string;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: '#0f172a',
    backgroundColor: '#ffffff',
    paddingTop: 32,
    paddingBottom: 44,
    paddingHorizontal: 32,
  },

  // ── Header ────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#0f172a',
    paddingBottom: 8,
    marginBottom: 10,
  },
  logo: {
    width: 130,
    height: 40,
    objectFit: 'contain',
  },
  logoFallback: {
    width: 130,
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#008B95',
  },
  headerTitleContainer: {
    flex: 1,
    paddingLeft: 12,
  },
  headerTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    textTransform: 'uppercase',
    textAlign: 'center',
    lineHeight: 1.2,
  },

  // ── Subcabeçalho / Declaração ──────────────────────────────────────
  declarationBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 0.8,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    padding: 8,
    marginBottom: 10,
    fontSize: 8,
    lineHeight: 1.4,
    color: '#1e293b',
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },

  // ── Tabela ─────────────────────────────────────────────────────────
  table: {
    width: '100%',
    borderWidth: 0.8,
    borderColor: '#0f172a',
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 0.8,
    borderBottomColor: '#0f172a',
    alignItems: 'center',
    minHeight: 18,
  },
  th: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    color: '#0f172a',
    textAlign: 'center',
    paddingVertical: 3,
    paddingHorizontal: 2,
    borderRightWidth: 0.5,
    borderRightColor: '#0f172a',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#cbd5e1',
    alignItems: 'center',
    minHeight: 16,
  },
  td: {
    fontSize: 7.5,
    color: '#1e293b',
    textAlign: 'center',
    paddingVertical: 3,
    paddingHorizontal: 2,
    borderRightWidth: 0.5,
    borderRightColor: '#cbd5e1',
  },
  tdLeft: {
    textAlign: 'left',
  },
  tdMono: {
    fontFamily: 'Courier',
    fontSize: 7,
  },

  // Larguras das Colunas (Soma = 100%)
  colIp: { width: '13%' },
  colSerie: { width: '18%' },
  colPat: { width: '13%' },
  colMac: { width: '17%' },
  colTec: { width: '6%' },
  colMouse: { width: '6%' },
  colMon: { width: '6%' },
  colLocal: { width: '21%', borderRightWidth: 0 },

  // ── Fechamento ────────────────────────────────────────────────────
  closureBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 0.8,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    padding: 8,
    marginBottom: 16,
    fontSize: 8,
    lineHeight: 1.4,
    color: '#1e293b',
  },

  // ── Assinaturas ───────────────────────────────────────────────────
  signaturesContainer: {
    marginTop: 20,
    marginBottom: 12,
  },
  signaturesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureCol: {
    width: '30%',
    alignItems: 'center',
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#0f172a',
    width: '100%',
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: '#334155',
    textAlign: 'center',
    textTransform: 'uppercase',
  },

  // ── Rodapé Fixo ───────────────────────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 14,
    left: 32,
    right: 32,
    borderTopWidth: 0.5,
    borderTopColor: '#cbd5e1',
    paddingTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 6.5,
    color: '#64748b',
  },
});

export const TermoEquipamentoPdf: React.FC<TermoEquipamentoPdfProps> = ({
  registro,
  docOperation,
  parametros,
  logoUrl,
}) => {
  const isEntrega = docOperation === 'entrega';
  const opTitle = isEntrega ? 'ENTREGA' : 'DEVOLUÇÃO';
  const resolvedLogo = logoUrl || '/hcescritorio/logo-hcfmb.png';

  return (
    <Document
      title={`Termo_${opTitle}_Folha_${registro.folha}`}
      author="Complexo HCFMB - HC Escritório"
      subject={`Termo de ${opTitle} de Computadores e Periféricos`}
      creator="HC Escritório"
    >
      <Page size="A4" orientation="portrait" style={styles.page} wrap>

        {/* ── Topo com Logo e Título Oficial ── */}
        <View style={styles.header}>
          {resolvedLogo ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image style={styles.logo} src={resolvedLogo} />
          ) : (
            <Text style={styles.logoFallback}>HOSPITAL DAS CLÍNICAS FMB</Text>
          )}
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>
              REGISTRO DE {opTitle} DE COMPUTADORES E PERIFÉRICOS
            </Text>
          </View>
        </View>

        {/* ── Declaração Inicial ── */}
        <View style={styles.declarationBox}>
          <Text>
            Declaro que em <Text style={styles.bold}>{parametros.docData || '—'}</Text> foi(ram){' '}
            {isEntrega
              ? 'entregue(s) o(s) computador(es) e periférico(s)'
              : 'devolvido(s) o(s) computador(es) e periférico(s)'}{' '}
            descrito(s) abaixo conforme especificação técnica publicada no edital de pregão eletrônico:{' '}
            <Text style={styles.bold}>{parametros.docEdital || '—'}</Text>, processo SEI nº{' '}
            <Text style={styles.bold}>{parametros.docSei || '—'}</Text> que originou o contrato{' '}
            <Text style={styles.bold}>{parametros.docContrato || '—'}</Text> com a empresa{' '}
            <Text style={styles.bold}>{parametros.docEmpresa || '—'}</Text>.
          </Text>
        </View>

        {/* ── Tabela Oficial de Equipamentos ── */}
        <View style={styles.table}>
          {/* Cabeçalho */}
          <View style={styles.tableHeader} fixed>
            <Text style={[styles.th, styles.colIp]}>Nr. IP</Text>
            <Text style={[styles.th, styles.colSerie]}>Nr. Série</Text>
            <Text style={[styles.th, styles.colPat]}>Pat. Contratada</Text>
            <Text style={[styles.th, styles.colMac]}>Mac Address</Text>
            <Text style={[styles.th, styles.colTec]}>Teclado</Text>
            <Text style={[styles.th, styles.colMouse]}>Mouse</Text>
            <Text style={[styles.th, styles.colMon]}>Monitor</Text>
            <Text style={[styles.th, styles.colLocal]}>Local Específico</Text>
          </View>

          {/* Linhas */}
          {registro.equipamentos.map((eq, idx) => (
            <View key={idx} style={styles.tableRow} wrap={false}>
              <Text style={[styles.td, styles.tdMono, styles.colIp]}>
                {eq.nrIp || '-'}
              </Text>
              <Text style={[styles.td, styles.bold, styles.colSerie]}>
                {eq.nrSerie || '-'}
              </Text>
              <Text style={[styles.td, styles.colPat]}>
                {eq.numEqpto || '-'}
              </Text>
              <Text style={[styles.td, styles.tdMono, styles.colMac]}>
                {eq.macAddress || '-'}
              </Text>
              <Text style={[styles.td, styles.bold, styles.colTec]}>
                {eq.teclado === 'S' ? 'S' : 'N'}
              </Text>
              <Text style={[styles.td, styles.bold, styles.colMouse]}>
                {eq.mouse === 'S' ? 'S' : 'N'}
              </Text>
              <Text style={[styles.td, styles.bold, styles.colMon]}>
                {eq.monitor === 'S' ? 'S' : 'N'}
              </Text>
              <Text style={[styles.td, styles.tdLeft, styles.colLocal]}>
                {eq.localEspecifico || registro.setor || '-'}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Declaração de Fechamento ── */}
        <View style={styles.closureBox} wrap={false}>
          <Text>
            {isEntrega ? (
              <>
                Declaro como recebido na área: <Text style={styles.bold}>{registro.setor}</Text> os
                computadores e periféricos descritos acima em perfeitas condições de uso.
              </>
            ) : (
              <>
                Declaro como liberado na área: <Text style={styles.bold}>{registro.setor}</Text> os
                equipamentos descritos e assinalados [S] acima em perfeitas condições de uso.
              </>
            )}
          </Text>
        </View>

        {/* ── Blocos de Assinatura ── */}
        <View style={styles.signaturesContainer} wrap={false}>
          <View style={styles.signaturesGrid}>
            <View style={styles.signatureCol}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>
                Nome/Assinatura técnico {parametros.docEmpresa || 'COMTECH'}
              </Text>
            </View>

            <View style={styles.signatureCol}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>
                Nome/Assinatura responsável pelo setor – complexo HCFMB
              </Text>
            </View>

            <View style={styles.signatureCol}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>
                Nome/Assinatura técnico CIMED
              </Text>
            </View>
          </View>
        </View>

        {/* ── Rodapé Fixo ── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Edital {parametros.docEdital || '-'} • Contrato {parametros.docContrato || '-'} ({parametros.docEmpresa || '-'}) • Setor: {registro.setor}
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `Folha ${registro.folha} | Página ${pageNumber} de ${totalPages}`
            }
          />
        </View>

      </Page>
    </Document>
  );
};
