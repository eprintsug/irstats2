package EPrints::Plugin::Stats::View::Cached;

our @ISA = qw/ EPrints::Plugin::Stats::View /;

use strict;

# Stats::View::Cached
#
# Displays a cached result
# 
# Options:
# - human_display: formats the number for humans (e.g. 1000 -> 1,000)

sub javascript_class
{
    return 'Cached';
}

sub ajax
{
    my( $self ) = @_;

    my $data = $self->handler->data( $self->context )->select()->data();

    binmode( STDOUT, ":utf8" );

    print STDOUT $data if( defined $data );

    return;
}

1;

